"use client";

import { useState, type FormEvent } from "react";
import { parseMealPlan, type MealPlan } from "@/lib/meal-plan";

type ParticipantDraft = {
  selections: string[];
  notes: string;
};

const groupPreferenceOptions = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Dairy-free",
  "Gluten-free",
  "No pork",
  "No beef",
  "Quick dinners",
];

export default function Home() {
  const [days, setDays] = useState(3);
  const [servings, setServings] = useState(2);
  const [preferences, setPreferences] = useState("");
  const [planningWithFriends, setPlanningWithFriends] = useState(false);
  const [participants, setParticipants] = useState<ParticipantDraft[]>([
    { selections: [], notes: "" },
    { selections: [], notes: "" },
  ]);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      const response = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days,
          servings,
          ...(planningWithFriends
            ? {
                participants: participants.map((participant) => ({
                  preferences: [...participant.selections, participant.notes].filter(Boolean).join(", "),
                })),
              }
            : { preferences }),
        }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null &&
          "error" in data && typeof data.error === "string"
            ? data.error
            : "We couldn't generate your plan. Please try again.";
        throw new Error(message);
      }
      const result = parseMealPlan(data, days);
      if (!result) throw new Error("The planner returned an invalid plan. Please try again.");
      setPlan(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reach the planner.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-20">
      <header className="mb-12">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-emerald-800">Foodplanning</p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">A little less dinner stress.</h1>
        <p className="mt-5 max-w-xl text-lg text-stone-600">Make room for good food. Tell us what sounds good, and get a dinner plan with a grocery list.</p>
      </header>

      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <form onSubmit={generatePlan} className="self-start rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold">{planningWithFriends ? "Plan with friends" : "Your dinner plan"}</h2>
          <fieldset className="mb-6">
            <legend className="mb-3 text-sm font-medium">Who are you planning for?</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm">
                <input
                  type="radio"
                  name="planning-mode"
                  checked={!planningWithFriends}
                  onChange={() => setPlanningWithFriends(false)}
                  disabled={loading}
                  className="accent-emerald-800"
                />
                Just me
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 p-3 text-sm">
                <input
                  type="radio"
                  name="planning-mode"
                  checked={planningWithFriends}
                  onChange={() => setPlanningWithFriends(true)}
                  disabled={loading}
                  className="accent-emerald-800"
                />
                With friends
              </label>
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium">
              Days
              <select value={days} onChange={(event) => setDays(Number(event.target.value))} disabled={loading} className="field">
                {[1, 2, 3, 4, 5, 6, 7].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">
              Servings per dinner
              <select value={servings} onChange={(event) => setServings(Number(event.target.value))} disabled={loading} className="field">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>
          {planningWithFriends ? (
            <fieldset className="mt-5 space-y-4">
              <legend className="text-sm font-medium">Everyone&apos;s preferences</legend>
              <p className="text-xs text-stone-500">Add 2–8 people. Pick what fits or add your own notes; preferences are labeled by person number, not name.</p>
              {participants.map((participant, index) => (
                <div key={index} className="rounded-2xl border border-stone-200 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      Person {index + 1}
                    </p>
                    {participants.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setParticipants((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        disabled={loading}
                        className="text-xs font-medium text-stone-600 underline hover:text-stone-900"
                        aria-label={`Remove person ${index + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <label className="text-xs font-medium text-stone-700" htmlFor={`participant-${index}-notes`}>
                    Other preferences or ingredients
                  </label>
                  <textarea
                    id={`participant-${index}-notes`}
                    value={participant.notes}
                    onChange={(event) => setParticipants((current) =>
                      current.map((item, itemIndex) => itemIndex === index
                        ? { ...item, notes: event.target.value }
                        : item)
                    )}
                    disabled={loading}
                    maxLength={300}
                    rows={2}
                    className="field resize-y"
                    placeholder="Other preferences, like no mushrooms..."
                  />
                  <fieldset className="mt-3">
                    <legend className="text-xs font-medium text-stone-700">Quick picks</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {groupPreferenceOptions.map((option) => (
                        <label
                          key={option}
                          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-stone-200 px-2.5 py-1.5 text-xs hover:bg-emerald-50"
                        >
                          <input
                            type="checkbox"
                            checked={participant.selections.includes(option)}
                            onChange={(event) => setParticipants((current) =>
                              current.map((item, itemIndex) => {
                                if (itemIndex !== index) return item;
                                const selections = event.target.checked
                                  ? [...item.selections, option]
                                  : item.selections.filter((selection) => selection !== option);
                                return { ...item, selections };
                              })
                            )}
                            disabled={loading}
                            className="accent-emerald-800"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <p className="mt-2 text-right text-xs text-stone-500">{participant.notes.length}/300 notes</p>
                </div>
              ))}
              {participants.length < 8 && (
                <button
                  type="button"
                  onClick={() => setParticipants((current) => [...current, { selections: [], notes: "" }])}
                  disabled={loading}
                  className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-60"
                >
                  Add a person
                </button>
              )}
              <p className="text-xs text-stone-500">Selections and notes are optional. Don&apos;t include names or personal or medical information. Check all ingredients yourself; AI can&apos;t guarantee allergen safety.</p>
            </fieldset>
          ) : (
            <>
              <label className="mt-5 block text-sm font-medium" htmlFor="preferences">Preferences & ingredients</label>
              <textarea id="preferences" value={preferences} onChange={(event) => setPreferences(event.target.value)} disabled={loading} maxLength={500} rows={5} className="field resize-y" placeholder="Vegetarian, quick dinners, use up spinach..." />
              <p className="mt-2 text-xs text-stone-500">Optional. Don&apos;t include personal or medical information.</p>
            </>
          )}
          <button disabled={loading} type="submit" className="mt-6 w-full rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60">
            {loading ? "Planning your dinners..." : planningWithFriends ? "Plan dinners for us" : "Create my plan"}
          </button>
          <p role="status" className="sr-only">{loading ? "Generating your meal plan. Please wait." : ""}</p>
          {error && <p role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
        </form>

        <section aria-label="Generated meal plan" aria-busy={loading} aria-live="polite">
          {!plan ? (
            <div className="rounded-3xl border border-dashed border-stone-300 p-10">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-800">Less planning. More cooking.</p>
              <h2 className="text-2xl font-semibold">Your week starts here.</h2>
              <p className="mt-3 text-stone-600">Your dinners and shopping list will appear here after you create a plan.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {plan.meals.map((meal) => (
                <article key={meal.day} className="rounded-3xl border border-stone-200 bg-white p-6">
                  <p className="text-sm font-semibold text-emerald-800">Day {meal.day} / {servings} servings</p>
                  <h2 className="mt-2 text-xl font-semibold">{meal.name}</h2>
                  <p className="mt-3 text-stone-600">{meal.instructions}</p>
                  <ul className="mt-4 list-inside list-disc text-sm text-stone-600">
                    {meal.ingredients.map((ingredient, index) => <li key={index}>{ingredient}</li>)}
                  </ul>
                </article>
              ))}
              <aside className="rounded-3xl bg-emerald-50 p-6">
                <h2 className="text-xl font-semibold">Your grocery list</h2>
                <ul className="mt-4 list-inside list-disc space-y-2">
                  {plan.groceryList.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </aside>
            </div>
          )}
        </section>
      </div>
      <footer className="mt-12 max-w-2xl text-sm text-stone-500">
        AI suggestions can be inaccurate. Check ingredients, allergens, quantities, and safe cooking instructions yourself. This is not medical or dietary advice.
      </footer>
    </main>
  );
}
