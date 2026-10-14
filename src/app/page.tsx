"use client";

import { useState, type FormEvent } from "react";
import PlannedFeatures from "@/app/components/planned-features";
import {
  budgets, cuisines, dietaryNeeds, createDiningPlan, parseDiningInput,
  type DiningParticipant, type DiningPlan,
} from "@/lib/social-dining";

type PersonDraft = DiningParticipant & { id: number };

function newPerson(id: number): PersonDraft {
  return { id, liked: [], avoided: [], dietaryNeeds: [], budget: "$$", notes: "" };
}

export default function Home() {
  const [area, setArea] = useState("");
  const [people, setPeople] = useState<PersonDraft[]>([newPerson(1), newPerson(2)]);
  const [nextId, setNextId] = useState(3);
  const [plan, setPlan] = useState<DiningPlan | null>(null);
  const [error, setError] = useState("");

  function updatePerson(id: number, changes: Partial<DiningParticipant>) {
    setPeople((current) => current.map((person) => person.id === id ? { ...person, ...changes } : person));
    setPlan(null);
    setError("");
  }

  function findPlaces(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = parseDiningInput({ area, participants: people });
    if (!input) {
      setError("Enter an area and valid preferences for 2-8 people.");
      setPlan(null);
      return;
    }
    setError("");
    setPlan(createDiningPlan(input));
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-20">
      <header className="mb-10">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-emerald-800">Foodplanning / Social dining</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Good friends. Less &quot;where should we eat?&quot;</h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">Everyone has their own tastes. Gather what sounds good right now, find common ground, and explore places to eat together.</p>
        <a href="#coming-next" className="mt-4 inline-block text-sm font-semibold text-emerald-800 underline underline-offset-4">See planned group-dining features</a>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <form onSubmit={findPlaces} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Plan your next outing</h2>
          <p className="mt-2 text-sm text-stone-600">One organizer enters everyone&apos;s preferences. No accounts or invite links needed.</p>
          <label htmlFor="area" className="mt-5 block text-sm font-medium">Where do you want to eat?</label>
          <input
            id="area" value={area} required maxLength={120} className="field"
            placeholder="City or neighborhood, e.g. Capitol Hill, Seattle"
            onChange={(event) => { setArea(event.target.value); setPlan(null); setError(""); }}
          />
          <p className="mt-2 text-xs text-stone-500">Use a public area, not a home address.</p>

          <div className="mt-6 space-y-5">
            {people.map((person, index) => (
              <fieldset key={person.id} className="rounded-2xl border border-stone-200 p-4">
                <legend className="px-1 text-sm font-semibold">Person {index + 1}</legend>
                {people.length > 2 && (
                  <button
                    type="button" className="mb-3 text-xs text-stone-600 underline"
                    aria-label={`Remove person ${index + 1}`}
                    onClick={() => {
                      setPeople((current) => current.filter((item) => item.id !== person.id));
                      setPlan(null); setError("");
                    }}
                  >Remove person</button>
                )}
                <fieldset>
                  <legend className="text-sm font-medium">What sounds good?</legend>
                  <p className="mt-1 text-xs text-stone-500">Pick favorites. Leave blank if you&apos;re open to anything.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cuisines.map((cuisine) => (
                      <label key={cuisine} className="flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 px-3 py-2 text-xs">
                        <input type="checkbox" className="accent-emerald-800"
                          checked={person.liked.includes(cuisine)}
                          onChange={(event) => updatePerson(person.id, {
                            liked: event.target.checked ? [...person.liked, cuisine] : person.liked.filter((item) => item !== cuisine),
                            avoided: person.avoided.filter((item) => item !== cuisine),
                          })}
                        />{cuisine}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="mt-4">
                  <legend className="text-sm font-medium">Any cuisines to skip?</legend>
                  <p className="mt-1 text-xs text-stone-500">A skip from anyone removes that cuisine from the shortlist.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cuisines.map((cuisine) => (
                      <label key={cuisine} className="flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 px-3 py-2 text-xs">
                        <input type="checkbox" className="accent-emerald-800"
                          checked={person.avoided.includes(cuisine)}
                          onChange={(event) => updatePerson(person.id, {
                            avoided: event.target.checked ? [...person.avoided, cuisine] : person.avoided.filter((item) => item !== cuisine),
                            liked: person.liked.filter((item) => item !== cuisine),
                          })}
                        />{cuisine}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label htmlFor={`budget-${person.id}`} className="mt-4 block text-sm font-medium">Comfortable price range per person</label>
                <select id={`budget-${person.id}`} value={person.budget} className="field"
                  onChange={(event) => {
                    const budget = budgets.find((item) => item === event.target.value);
                    if (budget) updatePerson(person.id, { budget });
                  }}>
                  <option value="$">$ - Budget-friendly</option>
                  <option value="$$">$$ - Mid-range</option>
                  <option value="$$$">$$$ - Higher-end</option>
                </select>
                <fieldset className="mt-4">
                  <legend className="text-sm font-medium">Dietary needs to check with the restaurant</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {dietaryNeeds.map((need) => (
                      <label key={need} className="flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 px-3 py-2 text-xs">
                        <input type="checkbox" className="accent-emerald-800"
                          checked={person.dietaryNeeds.includes(need)}
                          onChange={(event) => updatePerson(person.id, {
                            dietaryNeeds: event.target.checked ? [...person.dietaryNeeds, need] : person.dietaryNeeds.filter((item) => item !== need),
                          })}
                        />{need}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label htmlFor={`notes-${person.id}`} className="mt-4 block text-sm font-medium">Anything else to consider?</label>
                <textarea id={`notes-${person.id}`} value={person.notes} maxLength={300} rows={2} className="field resize-y"
                  placeholder="Outdoor seating, quiet enough to chat..."
                  onChange={(event) => updatePerson(person.id, { notes: event.target.value })}
                />
                <p className="mt-2 text-xs text-stone-500">Notes are a checklist for the organizer, not automatic restaurant filters. Don&apos;t enter names or personal or medical information.</p>
              </fieldset>
            ))}
          </div>
          {people.length < 8 && (
            <button type="button" className="mt-4 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
              onClick={() => {
                setPeople((current) => [...current, newPerson(nextId)]);
                setNextId((current) => current + 1);
                setPlan(null); setError("");
              }}>Add a person</button>
          )}
          <button type="submit" className="mt-6 w-full rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900">Find our dining options</button>
          {error && <p role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
        </form>

        <section aria-label="Group dining options" aria-live="polite" className="space-y-5 lg:sticky lg:top-6">
          {!plan ? (
            <div className="rounded-3xl border border-dashed border-stone-300 p-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-800">Less back-and-forth. More catching up.</p>
              <h2 className="text-2xl font-semibold">Find your group&apos;s common ground.</h2>
              <p className="mt-3 text-stone-600">Add an area and everyone&apos;s preferences to get a cuisine shortlist and Google Maps searches for places nearby.</p>
              <p className="mt-4 text-sm text-stone-500">No AI setup or API key required. These are search ideas, not verified restaurant recommendations.</p>
            </div>
          ) : (
            <>
              <div className="rounded-3xl bg-emerald-50 p-6">
                <h2 className="text-xl font-semibold">Your group&apos;s starting point</h2>
                <p className="mt-3 text-stone-700">{plan.groupSize} people / {plan.area} / {plan.budget}</p>
                <p className="mt-2 text-sm text-stone-600">We use the lowest selected price range and rank cuisines by favorites. Anyone&apos;s skips are excluded; ties follow the order shown in the form.</p>
                <h3 className="mt-4 font-semibold">Check before choosing</h3>
                <p className="mt-2 text-sm text-stone-700">
                  {plan.dietaryNeeds.length ? `Dietary needs: ${plan.dietaryNeeds.join(", ")}.` : "No dietary needs selected."}
                  {" "}Call the restaurant to confirm dietary needs, allergen handling, prices, hours, and seating for your group.
                </p>
                {plan.notes.length > 0 && (
                  <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-stone-700">
                    {plan.notes.map((note) => <li key={note.person}>Person {note.person}: {note.text}</li>)}
                  </ul>
                )}
              </div>
              {plan.options.length === 0 ? (
                <div role="status" className="rounded-3xl border border-stone-200 bg-white p-6">
                  <h3 className="text-xl font-semibold">No cuisines left on the shortlist.</h3>
                  <p className="mt-2 text-stone-600">Every available cuisine was skipped by someone. Discuss another option or revise the skips together.</p>
                </div>
              ) : plan.options.map((option) => (
                <article key={option.cuisine} className="rounded-3xl border border-stone-200 bg-white p-6">
                  <h3 className="text-xl font-semibold">{option.cuisine} restaurants</h3>
                  <p className="mt-2 text-sm text-stone-600">
                    {option.votes ? `${option.votes} of ${plan.groupSize} people picked this as a favorite.` : "An option to explore; nobody picked it as a favorite."}
                    {" "}Nobody marked this cuisine to skip. Dietary suitability and prices are not verified.
                  </p>
                  <a href={option.mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-4 inline-block rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-900">
                    Explore {option.cuisine} places on Maps
                  </a>
                </article>
              ))}
              <p className="text-xs text-stone-500">Maps links send only the area, cuisine, and price-range search wording to Google when opened. Individual dietary needs and notes are not included. Search results may not match your budget or requirements.</p>
            </>
          )}
        </section>
      </div>
      <PlannedFeatures />
      <footer className="mt-12 max-w-3xl text-sm text-stone-500">
        Preferences stay in this browser tab and clear on refresh. This app does not verify restaurant availability or dietary safety. Confirm all requirements directly with the restaurant.
      </footer>
    </main>
  );
}
