import assert from "node:assert/strict";
import test from "node:test";
import { cuisines, createDiningPlan, parseDiningInput } from "../src/lib/social-dining.ts";

function person(changes = {}) {
  return { liked: [], avoided: [], dietaryNeeds: [], budget: "$$", notes: "", ...changes };
}

test("accepts 2-8 profiles, trims input, and preserves independent lists", () => {
  for (const count of [2, 8]) {
    const input = parseDiningInput({ area: " Seattle ", participants: Array.from({ length: count }, () => person({ notes: " quiet " })) });
    assert.equal(input.area, "Seattle");
    assert.equal(input.participants.length, count);
    assert.equal(input.participants[0].notes, "quiet");
  }
});

test("rejects malformed input and conflicting preferences", () => {
  const valid = { area: "Seattle", participants: [person(), person()] };
  for (const value of [
    null, [], {}, { ...valid, area: " " }, { ...valid, area: "a".repeat(121) },
    { ...valid, participants: [person()] }, { ...valid, participants: Array(9).fill(person()) },
    ...[
      null, person({ budget: "free" }), person({ liked: ["Unknown"] }),
      person({ liked: ["Italian", "Italian"] }), person({ avoided: null }),
      person({ dietaryNeeds: ["Unknown"] }), person({ notes: "a".repeat(301) }),
      person({ liked: ["Italian"], avoided: ["Italian"] }),
    ].map((invalid) => ({ ...valid, participants: [invalid, person()] })),
  ]) assert.equal(parseDiningInput(value), null);
});

test("ranks by favorites, honors everyone's skips, and uses the lowest budget", () => {
  const plan = createDiningPlan({
    area: "Seattle",
    participants: [
      person({ liked: ["Italian", "Mexican"], budget: "$$$", dietaryNeeds: ["Vegan"], notes: "Outdoor seating" }),
      person({ liked: ["Italian", "Thai"], avoided: ["Mexican"], budget: "$", dietaryNeeds: ["Gluten-free"] }),
    ],
  });
  assert.deepEqual(plan.options.map((option) => [option.cuisine, option.votes]), [["Italian", 2], ["Thai", 1], ["Japanese", 0]]);
  assert.equal(plan.budget, "$");
  assert.deepEqual(plan.dietaryNeeds, ["Vegan", "Gluten-free"]);
  assert.deepEqual(plan.notes, [{ person: 1, text: "Outdoor seating" }]);
  assert.equal(plan.groupSize, 2);
});

test("encodes Maps queries safely without sending personal notes or dietary needs", () => {
  const area = "Seattle & Bellevue #1";
  const plan = createDiningPlan({
    area, participants: [person({ dietaryNeeds: ["Vegan"], notes: "Private note" }), person()],
  });
  const url = new URL(plan.options[0].mapsUrl);
  assert.equal(url.origin, "https://www.google.com");
  assert.equal(url.pathname, "/maps/search/");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("query"), `moderately priced Italian restaurants in ${area}`);
  assert.equal(url.hash, "");
  assert.ok(!url.toString().includes("Vegan"));
  assert.ok(!url.toString().includes("Private"));
});

test("handles no favorites deterministically and never falls back to a skipped cuisine", () => {
  const open = createDiningPlan({ area: "Seattle", participants: [person(), person()] });
  assert.deepEqual(open.options.map((option) => option.cuisine), cuisines.slice(0, 3));
  const excluded = createDiningPlan({ area: "Seattle", participants: [person({ avoided: [...cuisines] }), person()] });
  assert.deepEqual(excluded.options, []);
});
