import assert from "node:assert/strict";
import test from "node:test";
import { parseMealPlan, parsePlanningInput } from "../src/lib/meal-plan.ts";

test("accepts and trims valid input at both boundaries", () => {
  for (const [days, servings] of [[1, 1], [7, 8]]) {
    assert.deepEqual(parsePlanningInput({ days, servings, preferences: " veggie " }), { days, servings, preferences: "veggie" });
  }
  assert.ok(parsePlanningInput({ days: 3, servings: 2, preferences: "" }));
  assert.ok(parsePlanningInput({ days: 3, servings: 2, preferences: "a".repeat(500) }));
});

test("rejects invalid input rather than silently defaulting", () => {
  const valid = { days: 3, servings: 2, preferences: "" };
  for (const value of [null, [], {}, { ...valid, days: 0 }, { ...valid, days: 8 },
    { ...valid, days: 1.5 }, { ...valid, days: "3" }, { ...valid, servings: 0 },
    { ...valid, servings: 9 }, { ...valid, servings: 1.5 }, { ...valid, preferences: null },
    { ...valid, preferences: "a".repeat(501) }]) {
    assert.equal(parsePlanningInput(value), null);
  }
});

test("accepts group profiles and combines them without sending names", () => {
  assert.deepEqual(
    parsePlanningInput({
      days: 3,
      servings: 4,
      participants: [{ preferences: " vegetarian " }, { preferences: "" }],
    }),
    {
      days: 3,
      servings: 4,
      preferences: "Person 1: vegetarian\nPerson 2: No additional preferences",
    },
  );
});

test("rejects invalid group profile counts, values, and oversized combined preferences", () => {
  const valid = { days: 3, servings: 2 };
  for (const participants of [
    [],
    [{ preferences: "one" }],
    Array(9).fill({ preferences: "okay" }),
    [{ preferences: null }, { preferences: "okay" }],
    [{ preferences: "a".repeat(401) }, { preferences: "okay" }],
    Array(8).fill({ preferences: "a".repeat(400) }),
  ]) {
    assert.equal(parsePlanningInput({ ...valid, participants }), null);
  }
});

function validPlan(days = 1) {
  return {
    meals: Array.from({ length: days }, (_, index) => ({
      day: index + 1, name: "Roasted vegetables", instructions: "Roast until tender.",
      ingredients: ["2 carrots", "1 tablespoon olive oil"],
    })),
    groceryList: ["2 carrots", "1 tablespoon olive oil"],
  };
}

test("accepts the exact requested number of sequential meals", () => {
  for (const days of [1, 3, 7]) assert.deepEqual(parseMealPlan(validPlan(days), days), validPlan(days));
});

test("rejects incorrect meal counts and day numbers", () => {
  assert.equal(parseMealPlan(validPlan(), 2), null);
  for (const day of [0, 2, "1"]) {
    const plan = validPlan();
    plan.meals[0].day = day;
    assert.equal(parseMealPlan(plan, 1), null);
  }
  const duplicate = validPlan(2);
  duplicate.meals[1].day = 1;
  assert.equal(parseMealPlan(duplicate, 2), null);
});

test("rejects missing, empty, oversized, or non-string meal fields", () => {
  for (const field of ["name", "instructions", "ingredients"]) {
    for (const value of [undefined, null, "", " ", [], [""], [123], "a".repeat(2001)]) {
      const plan = validPlan();
      plan.meals[0][field] = value;
      assert.equal(parseMealPlan(plan, 1), null);
    }
  }
});

test("rejects malformed lists and root shapes", () => {
  for (const value of [null, [], {}, { ...validPlan(), meals: [null] },
    { ...validPlan(), groceryList: [] }, { ...validPlan(), groceryList: [""] },
    { ...validPlan(), groceryList: [3] }, { ...validPlan(), groceryList: Array(101).fill("carrot") }]) {
    assert.equal(parseMealPlan(value, 1), null);
  }
  for (const days of [0, 8, 1.5]) assert.equal(parseMealPlan(validPlan(), days), null);
});
