export const cuisines = ["Italian", "Mexican", "Japanese", "Indian", "Thai", "Mediterranean", "Chinese", "American"] as const;
export const dietaryNeeds = ["Vegetarian", "Vegan", "Pescatarian", "Dairy-free", "Gluten-free", "No pork", "No beef"] as const;
export const budgets = ["$", "$$", "$$$"] as const;

export type Cuisine = typeof cuisines[number];
export type DietaryNeed = typeof dietaryNeeds[number];
export type Budget = typeof budgets[number];
export type DiningParticipant = {
  liked: Cuisine[];
  avoided: Cuisine[];
  dietaryNeeds: DietaryNeed[];
  budget: Budget;
  notes: string;
};
export type DiningInput = {
  area: string;
  participants: DiningParticipant[];
};
export type DiningPlan = {
  area: string;
  groupSize: number;
  budget: Budget;
  dietaryNeeds: DietaryNeed[];
  notes: { person: number; text: string }[];
  options: { cuisine: Cuisine; votes: number; mapsUrl: string }[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isChoiceList<T extends string>(value: unknown, choices: readonly T[]): value is T[] {
  return Array.isArray(value) && value.length <= choices.length &&
    value.every((item) => typeof item === "string" && choices.some((choice) => choice === item)) &&
    new Set(value).size === value.length;
}

export function parseDiningInput(value: unknown): DiningInput | null {
  if (!isRecord(value) || typeof value.area !== "string" ||
    !value.area.trim() || value.area.length > 120 ||
    !Array.isArray(value.participants) || value.participants.length < 2 || value.participants.length > 8) return null;

  const participants: DiningParticipant[] = [];
  for (const person of value.participants) {
    if (!isRecord(person) || !isChoiceList(person.liked, cuisines) ||
      !isChoiceList(person.avoided, cuisines) || !isChoiceList(person.dietaryNeeds, dietaryNeeds) ||
      !budgets.some((budget) => budget === person.budget) ||
      typeof person.notes !== "string" || person.notes.length > 300) return null;
    const avoided = person.avoided;
    if (person.liked.some((cuisine) => avoided.includes(cuisine))) return null;
    const budget = budgets.find((option) => option === person.budget);
    if (!budget) return null;
    participants.push({
      liked: [...person.liked],
      avoided: [...person.avoided],
      dietaryNeeds: [...person.dietaryNeeds],
      budget,
      notes: person.notes.trim(),
    });
  }
  return { area: value.area.trim(), participants };
}

export function createDiningPlan(input: DiningInput): DiningPlan {
  const budget = budgets.find((option) => input.participants.some((person) => person.budget === option));
  if (!budget) throw new Error("Choose a budget for each person.");
  const budgetSearch = { "$": "budget-friendly", "$$": "moderately priced", "$$$": "" }[budget];
  const options = cuisines
    .filter((cuisine) => !input.participants.some((person) => person.avoided.includes(cuisine)))
    .map((cuisine) => {
      const query = [budgetSearch, cuisine, "restaurants in", input.area].filter(Boolean).join(" ");
      const url = new URL("https://www.google.com/maps/search/");
      url.searchParams.set("api", "1");
      url.searchParams.set("query", query);
      return {
        cuisine,
        votes: input.participants.filter((person) => person.liked.includes(cuisine)).length,
        mapsUrl: url.toString(),
      };
    })
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 3);

  return {
    area: input.area,
    groupSize: input.participants.length,
    budget,
    dietaryNeeds: dietaryNeeds.filter((need) => input.participants.some((person) => person.dietaryNeeds.includes(need))),
    notes: input.participants.flatMap((person, index) => person.notes ? [{ person: index + 1, text: person.notes }] : []),
    options,
  };
}
