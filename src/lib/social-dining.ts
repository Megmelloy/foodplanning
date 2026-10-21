export const cuisines = ["Italian", "Mexican", "Japanese", "Indian", "Thai", "Mediterranean", "Chinese", "American"] as const;
export const dietaryNeeds = ["Vegetarian", "Vegan", "Pescatarian", "Dairy-free", "Gluten-free", "No pork", "No beef"] as const;
export const budgets = ["$", "$$", "$$$"] as const;
export const minParticipants = 2;
export const maxParticipants = 15;

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
export type GroupVote = Cuisine | null;
export type VoteSummary = {
  totals: { cuisine: Cuisine; votes: number }[];
  votesCast: number;
  leaders: Cuisine[];
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
    !Array.isArray(value.participants) || value.participants.length < minParticipants || value.participants.length > maxParticipants) return null;

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

export function tallyVotes(options: readonly Cuisine[], votes: readonly GroupVote[]): VoteSummary {
  if (new Set(options).size !== options.length) throw new Error("Shortlist options must be unique.");
  if (votes.some((vote) => vote !== null && !options.includes(vote))) {
    throw new Error("Votes must be for a shortlisted option.");
  }

  const totals = options.map((cuisine) => ({
    cuisine,
    votes: votes.filter((vote) => vote === cuisine).length,
  }));
  const votesCast = votes.filter((vote) => vote !== null).length;
  const highest = Math.max(0, ...totals.map((total) => total.votes));
  return {
    totals,
    votesCast,
    leaders: highest ? totals.filter((total) => total.votes === highest).map((total) => total.cuisine) : [],
  };
}
