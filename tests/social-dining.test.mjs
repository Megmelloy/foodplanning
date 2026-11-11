import assert from "node:assert/strict";
import test from "node:test";
import {
  createCalendarEvent, createDiningPlan, cuisines, formatSchedule, invitesRemaining, maxInvites, maxParticipants,
  parseDiningInput, parseSchedule, tallyVotes,
} from "../src/lib/social-dining.ts";

const now = new Date(2026, 9, 21, 15, 30);
const schedule = { date: "2026-10-23", time: "19:00" };

function person(changes = {}) {
  return { liked: [], avoided: [], dietaryNeeds: [], budget: "$$", notes: "", ...changes };
}

test("accepts 2-15 profiles, trims input, and preserves independent lists", () => {
  for (const count of [2, maxParticipants]) {
    const input = parseDiningInput({ area: " Seattle ", schedule, participants: Array.from({ length: count }, () => person({ notes: " quiet " })) }, now);
    assert.equal(input.area, "Seattle");
    assert.deepEqual(input.schedule, schedule);
    assert.equal(input.participants.length, count);
    assert.equal(input.participants[0].notes, "quiet");
  }
});

test("rejects malformed input and conflicting preferences", () => {
  const valid = { area: "Seattle", schedule, participants: [person(), person()] };
  for (const value of [
    null, [], {}, { ...valid, area: " " }, { ...valid, area: "a".repeat(121) }, { ...valid, schedule: undefined },
    { ...valid, participants: [person()] }, { ...valid, participants: Array(maxParticipants + 1).fill(person()) },
    ...[
      null, person({ budget: "free" }), person({ liked: ["Unknown"] }),
      person({ liked: ["Italian", "Italian"] }), person({ avoided: null }),
      person({ dietaryNeeds: ["Unknown"] }), person({ notes: "a".repeat(301) }),
      person({ liked: ["Italian"], avoided: ["Italian"] }),
    ].map((invalid) => ({ ...valid, participants: [invalid, person()] })),
  ]) assert.equal(parseDiningInput(value, now), null);
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
    area, schedule, participants: [person({ dietaryNeeds: ["Vegan"], notes: "Private note" }), person()],
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
  const open = createDiningPlan({ area: "Seattle", schedule, participants: [person(), person()] });
  assert.deepEqual(open.options.map((option) => option.cuisine), cuisines.slice(0, 3));
  const excluded = createDiningPlan({ area: "Seattle", schedule, participants: [person({ avoided: [...cuisines] }), person()] });
  assert.deepEqual(excluded.options, []);
});

test("tallies one optional vote per person and reports a single leader", () => {
  const summary = tallyVotes(["Italian", "Thai", "Japanese"], ["Thai", null, "Thai", "Italian"]);
  assert.deepEqual(summary.totals, [
    { cuisine: "Italian", votes: 1 },
    { cuisine: "Thai", votes: 2 },
    { cuisine: "Japanese", votes: 0 },
  ]);
  assert.equal(summary.votesCast, 3);
  assert.deepEqual(summary.leaders, ["Thai"]);
});

test("reports ties, no votes, and rejects votes outside the shortlist", () => {
  assert.deepEqual(tallyVotes(["Italian", "Thai"], ["Italian", "Thai"]).leaders, ["Italian", "Thai"]);
  assert.deepEqual(tallyVotes(["Italian", "Thai"], [null, null]).leaders, []);
  assert.throws(() => tallyVotes(["Italian"], ["Thai"]), /shortlisted option/);
  assert.throws(() => tallyVotes(["Italian", "Italian"], []), /unique/);
});

test("accepts a future date and time within a year and rejects past or invalid schedules", () => {
  assert.deepEqual(parseSchedule(schedule, now), schedule);
  assert.deepEqual(parseSchedule({ date: "2026-10-21", time: "15:31" }, now), { date: "2026-10-21", time: "15:31" });
  for (const value of [
    null, {}, { date: "2026-10-23" }, { date: "10/23/2026", time: "19:00" }, { date: "2026-10-23", time: "7pm" },
    { date: "2026-10-23", time: "24:00" }, { date: "2027-02-30", time: "19:00" },
    { date: "2026-10-21", time: "15:30" }, { date: "2026-10-20", time: "19:00" }, { date: "2027-10-23", time: "19:00" },
  ]) assert.equal(parseSchedule(value, now), null);
});

test("formats the schedule for people and exports a calendar event", () => {
  assert.equal(formatSchedule(schedule), "Fri, Oct 23 · 7:00 PM");
  assert.equal(formatSchedule({ date: "2026-10-24", time: "00:05" }), "Sat, Oct 24 · 12:05 AM");
  const plan = createDiningPlan({ area: "Capitol Hill, Seattle", schedule: { date: "2026-12-31", time: "23:00" }, participants: [person(), person()] });
  const event = createCalendarEvent(plan, "Thai", new Date(Date.UTC(2026, 9, 21, 22, 30)));
  assert.match(event, /^BEGIN:VCALENDAR\r\n/);
  assert.match(event, /\r\nDTSTART:20261231T230000\r\n/);
  assert.match(event, /\r\nDTEND:20270101T010000\r\n/);
  assert.match(event, /\r\nDTSTAMP:20261021T223000Z\r\n/);
  assert.match(event, /\r\nSUMMARY:Group dinner: Thai\r\n/);
  assert.match(event, /\r\nLOCATION:Capitol Hill\\, Seattle\r\n/);
  assert.match(event, /END:VCALENDAR\r\n$/);
});

test("limits organizer invites to the small-party cap", () => {
  assert.equal(maxInvites, maxParticipants - 1);
  assert.equal(invitesRemaining(2), maxParticipants - 2);
  assert.equal(invitesRemaining(maxParticipants), 0);
  assert.equal(invitesRemaining(maxParticipants + 3), 0);
});