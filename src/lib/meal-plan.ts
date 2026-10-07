export type PlanningInput = {
  days: number;
  servings: number;
  preferences: string;
};

export type MealPlan = {
  meals: { day: number; name: string; instructions: string; ingredients: string[] }[];
  groceryList: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 2000;
}

function isTextList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 100 && value.every(isText);
}

export function parsePlanningInput(value: unknown): PlanningInput | null {
  if (
    !isRecord(value) ||
    typeof value.days !== "number" || !Number.isInteger(value.days) || value.days < 1 || value.days > 7 ||
    typeof value.servings !== "number" || !Number.isInteger(value.servings) || value.servings < 1 || value.servings > 8 ||
    typeof value.preferences !== "string" || value.preferences.length > 500
  ) return null;
  return { days: value.days, servings: value.servings, preferences: value.preferences.trim() };
}

export function parseMealPlan(value: unknown, days: number): MealPlan | null {
  if (!Number.isInteger(days) || days < 1 || days > 7 || !isRecord(value) ||
    !Array.isArray(value.meals) || value.meals.length !== days ||
    !isTextList(value.groceryList)) return null;

  const meals: MealPlan["meals"] = [];
  for (const [index, meal] of value.meals.entries()) {
    if (!isRecord(meal) || meal.day !== index + 1 || !isText(meal.name) ||
      !isText(meal.instructions) || !isTextList(meal.ingredients)) return null;
    meals.push({ day: index + 1, name: meal.name, instructions: meal.instructions, ingredients: meal.ingredients });
  }
  return { meals, groceryList: value.groceryList };
}

export const mealPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["meals", "groceryList"],
  properties: {
    meals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "name", "instructions", "ingredients"],
        properties: {
          day: { type: "integer" },
          name: { type: "string" },
          instructions: { type: "string" },
          ingredients: { type: "array", items: { type: "string" } },
        },
      },
    },
    groceryList: { type: "array", items: { type: "string" } },
  },
};
