"use client";

import { useState, type FormEvent } from "react";
import { parseMealPlan, type MealPlan } from "@/lib/meal-plan";

export default function Home() {
  const [days, setDays] = useState(3);
  const [servings, setServings] = useState(2);
  const [preferences, setPreferences] = useState("");
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
        body: JSON.stringify({ days, servings, preferences }),
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
          <h2 className="mb-6 text-xl font-semibold">Your dinner plan</h2>
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
          <label className="mt-5 block text-sm font-medium" htmlFor="preferences">Preferences & ingredients</label>
          <textarea id="preferences" value={preferences} onChange={(event) => setPreferences(event.target.value)} disabled={loading} maxLength={500} rows={5} className="field resize-y" placeholder="Vegetarian, quick dinners, use up spinach..." />
          <p className="mt-2 text-xs text-stone-500">Optional. Don&apos;t include personal or medical information.</p>
          <button disabled={loading} type="submit" className="mt-6 w-full rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60">
            {loading ? "Planning your dinners..." : "Create my plan"}
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
