"use client";

import { useState, type FormEvent } from "react";
import {
  budgets,
  createCalendarEvent,
  createDiningPlan,
  cuisines,
  dietaryNeeds,
  formatSchedule,
  invitesRemaining,
  maxDaysAhead,
  maxInvites,
  maxParticipants,
  minParticipants,
  parseDiningInput,
  parseSchedule,
  tallyVotes,
  type Budget,
  type Cuisine,
  type DiningParticipant,
  type DiningPlan,
  type GroupVote,
} from "@/lib/social-dining";

type PersonDraft = DiningParticipant & { id: number };
type Step = 1 | 2 | 3;
type Preference = "love" | "open" | "skip";

const cuisineIcons: Record<Cuisine, string> = {
  Italian: "🍝",
  Mexican: "🌮",
  Japanese: "🍣",
  Indian: "🍛",
  Thai: "🍜",
  Mediterranean: "🥙",
  Chinese: "🥟",
  American: "🍔",
};
const budgetLabels: Record<Budget, string> = {
  $: "Budget-friendly",
  $$: "Mid-range",
  $$$: "Splurge",
};
const steps: { number: Step; label: string; hint: string }[] = [
  { number: 1, label: "Where & when", hint: "Area and time" },
  { number: 2, label: "Tastes", hint: "Loves and skips" },
  { number: 3, label: "Vote", hint: "Decide together" },
];
const preferences: { value: Preference; label: string; checked: string }[] = [
  {
    value: "love",
    label: "Love",
    checked: "has-[:checked]:bg-herb has-[:checked]:text-white",
  },
  {
    value: "open",
    label: "Open",
    checked:
      "has-[:checked]:bg-white has-[:checked]:text-ink has-[:checked]:shadow-sm",
  },
  {
    value: "skip",
    label: "Skip",
    checked: "has-[:checked]:bg-tomato has-[:checked]:text-white",
  },
];

const card =
  "rounded-[2rem] border border-ink/10 bg-white p-5 shadow-[0_24px_60px_-42px_rgba(28,25,23,0.55)] sm:p-8";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3.5 font-semibold text-white shadow-lg shadow-ink/15 transition hover:-translate-y-0.5 hover:bg-black disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-ink/25 disabled:shadow-none";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-ink/15 bg-white px-5 py-3.5 font-semibold text-ink transition hover:border-ink/35 hover:bg-cream";

function newPerson(id: number): PersonDraft {
  return {
    id,
    liked: [],
    avoided: [],
    dietaryNeeds: [],
    budget: "$$",
    notes: "",
  };
}

function preferenceFor(
  person: DiningParticipant,
  cuisine: Cuisine,
): Preference {
  if (person.liked.includes(cuisine)) return "love";
  return person.avoided.includes(cuisine) ? "skip" : "open";
}

function hasInput(person: DiningParticipant) {
  return (
    person.liked.length + person.avoided.length + person.dietaryNeeds.length >
      0 || person.notes.trim() !== ""
  );
}

function StepHeading({
  number,
  id,
  title,
  description,
}: {
  number: Step;
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-tomato">
        Step {number} of 3
      </p>
      <h2
        id={id}
        className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-ink/65">{description}</p>
    </div>
  );
}

export default function Home() {
  const [area, setArea] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [detailsReady, setDetailsReady] = useState(false);
  const [errorField, setErrorField] = useState<"area" | "schedule" | null>(
    null,
  );
  const [people, setPeople] = useState<PersonDraft[]>([
    newPerson(1),
    newPerson(2),
  ]);
  const [nextId, setNextId] = useState(3);
  const [activeId, setActiveId] = useState(1);
  const [step, setStep] = useState<Step>(1);
  const [plan, setPlan] = useState<DiningPlan | null>(null);
  const [error, setError] = useState("");
  const [votes, setVotes] = useState<GroupVote[]>([]);
  const [tieChoice, setTieChoice] = useState<Cuisine | null>(null);
  const [finalChoice, setFinalChoice] = useState<Cuisine | null>(null);

  const activeIndex = Math.max(
    0,
    people.findIndex((person) => person.id === activeId),
  );
  const activePerson = people[activeIndex];
  const voteSummary = plan
    ? tallyVotes(
        plan.options.map((option) => option.cuisine),
        votes,
      )
    : null;
  const leaders = voteSummary?.leaders ?? [];
  const decision =
    leaders.length === 1
      ? leaders[0]
      : tieChoice && leaders.includes(tieChoice)
        ? tieChoice
        : null;
  const finalOption = plan?.options.find(
    (option) => option.cuisine === finalChoice,
  );
  const groupBudget =
    budgets.find((budget) =>
      people.some((person) => person.budget === budget),
    ) ?? "$$";
  const groupNeeds = dietaryNeeds.filter((need) =>
    people.some((person) => person.dietaryNeeds.includes(need)),
  );
  const groupNotes = people.flatMap((person, index) =>
    person.notes.trim()
      ? [{ person: index + 1, text: person.notes.trim() }]
      : [],
  );
  const readyCount = people.filter(hasInput).length;
  const organizer = people[0];
  const guests = people.slice(1);
  const organizerActive = activePerson?.id === organizer.id;
  const invitesLeft = invitesRemaining(people.length);
  const when = date && time ? formatSchedule({ date, time }) : null;

  function showStep(next: Step) {
    setStep(next);
    setError("");
    setErrorField(null);
    document
      .getElementById("planner")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function canVisit(target: Step) {
    return (
      target === 1 ||
      (target === 2 && detailsReady) ||
      (target === 3 && plan !== null)
    );
  }

  function editDetails(update: () => void) {
    update();
    setDetailsReady(false);
    clearPlan();
  }

  function clearPlan() {
    setPlan(null);
    setVotes([]);
    setTieChoice(null);
    setFinalChoice(null);
    setError("");
    setErrorField(null);
  }

  function updatePerson(id: number, changes: Partial<DiningParticipant>) {
    setPeople((current) =>
      current.map((person) =>
        person.id === id ? { ...person, ...changes } : person,
      ),
    );
    clearPlan();
  }

  function setPreference(
    person: PersonDraft,
    cuisine: Cuisine,
    preference: Preference,
  ) {
    const liked = person.liked.filter((item) => item !== cuisine);
    const avoided = person.avoided.filter((item) => item !== cuisine);
    updatePerson(person.id, {
      liked: preference === "love" ? [...liked, cuisine] : liked,
      avoided: preference === "skip" ? [...avoided, cuisine] : avoided,
    });
  }

  function inviteGuest() {
    if (!organizerActive || invitesLeft === 0) return;
    setPeople((current) => [...current, newPerson(nextId)]);
    setNextId((current) => current + 1);
    clearPlan();
  }

  function removeGuest(id: number) {
    if (
      !organizerActive ||
      id === organizer.id ||
      people.length <= minParticipants
    )
      return;
    setPeople((current) => current.filter((person) => person.id !== id));
    clearPlan();
  }

  function continueFromDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!area.trim()) {
      setError("Enter a city, neighborhood, or ZIP code to continue.");
      setErrorField("area");
      return;
    }
    if (!parseSchedule({ date, time })) {
      setError(
        `Pick a date and time that hasn't passed yet, within the next ${maxDaysAhead} days.`,
      );
      setErrorField("schedule");
      return;
    }
    setDetailsReady(true);
    showStep(2);
  }

  function downloadCalendar() {
    if (!plan || !finalOption) return;
    const file = new Blob([createCalendarEvent(plan, finalOption.cuisine)], {
      type: "text/calendar;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `table-sync-${plan.schedule.date}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 0);
  }

  function buildShortlist() {
    if (plan) {
      showStep(3);
      return;
    }
    const input = parseDiningInput({
      area,
      schedule: { date, time },
      participants: people,
    });
    if (!input) {
      setError(
        parseSchedule({ date, time })
          ? `Add valid tastes for ${minParticipants}-${maxParticipants} people.`
          : "Your dinner time has passed. Go back to step 1 and pick a new one.",
      );
      return;
    }
    const nextPlan = createDiningPlan(input);
    setPlan(nextPlan);
    setVotes(Array.from({ length: nextPlan.groupSize }, () => null));
    setTieChoice(null);
    setFinalChoice(null);
    showStep(3);
  }

  function updateVote(person: number, vote: GroupVote) {
    setVotes((current) =>
      current.map((item, index) => (index === person ? vote : item)),
    );
    setTieChoice(null);
    setFinalChoice(null);
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <p className="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl bg-tomato text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3.5" />
              </svg>
            </span>
            Table Sync
          </p>
          <span className="rounded-full bg-herb/10 px-3 py-1.5 text-xs font-semibold text-herb">
            Small group · up to {maxParticipants}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16">
        <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-ink px-6 py-10 text-white sm:px-12 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-tomato/60 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 right-48 h-64 w-64 rounded-full bg-saffron/35 blur-3xl"
          />
          <div className="relative grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-saffron">
                Group dining, minus the group chat
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                Dinner, decided together.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-white/75">
                Collect everyone&apos;s cravings and dealbreakers, get a
                shortlist that respects all of them, and vote in minutes.
              </p>
            </div>
            <div aria-hidden className="hidden grid-cols-4 gap-3 md:grid">
              {cuisines.map((cuisine, index) => (
                <div
                  key={cuisine}
                  className={`grid aspect-square place-items-center rounded-2xl bg-white/10 text-3xl ring-1 ring-white/10 ${index % 2 ? "translate-y-3" : ""}`}
                >
                  {cuisineIcons[cuisine]}
                </div>
              ))}
            </div>
          </div>
        </section>

        <nav
          id="planner"
          aria-label="Planning progress"
          className="mt-8 scroll-mt-24"
        >
          <ol className="grid grid-cols-3 gap-2 rounded-[1.5rem] border border-ink/10 bg-white p-2">
            {steps.map((item) => {
              const current = item.number === step;
              const done =
                item.number < step ||
                (item.number === 3 && finalOption !== undefined);
              const reachable = canVisit(item.number);
              return (
                <li key={item.number}>
                  <button
                    type="button"
                    disabled={current || !reachable}
                    aria-current={current ? "step" : undefined}
                    onClick={() => showStep(item.number)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition disabled:cursor-default ${current ? "bg-ink text-white" : reachable ? "hover:bg-cream" : "opacity-45"}`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${current ? "bg-saffron text-ink" : done ? "bg-herb text-white" : "bg-ink/10"}`}
                    >
                      {done && !current ? "✓" : item.number}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className="hidden text-xs opacity-65 sm:block">
                        {item.hint}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {step === 1 && (
              <form
                onSubmit={continueFromDetails}
                noValidate
                className={card}
                aria-labelledby="where-heading"
              >
                <StepHeading
                  number={1}
                  id="where-heading"
                  title="Where and when?"
                  description="The organizer sets the area and one dinner time. Use a public area, not a home address."
                />
                <label htmlFor="area" className="text-sm font-semibold">
                  Area
                </label>
                <div className="relative mt-2">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21Z" />
                    <circle cx="12" cy="9.5" r="2.5" />
                  </svg>
                  <input
                    id="area"
                    value={area}
                    maxLength={120}
                    autoComplete="address-level2"
                    placeholder="Capitol Hill, Seattle or 98102"
                    aria-invalid={errorField === "area" ? true : undefined}
                    aria-describedby={
                      errorField === "area"
                        ? "area-help details-error"
                        : "area-help"
                    }
                    className="w-full rounded-2xl border border-ink/15 bg-cream/60 py-4 pl-12 pr-4 text-lg transition placeholder:text-ink/35 focus:border-herb focus:bg-white"
                    onChange={(event) =>
                      editDetails(() => setArea(event.target.value))
                    }
                  />
                </div>
                <p id="area-help" className="mt-2 text-sm text-ink/55">
                  Used only to build restaurant searches on Google Maps.
                </p>

                <fieldset
                  className="mt-6"
                  aria-describedby={
                    errorField === "schedule"
                      ? "when-help details-error"
                      : "when-help"
                  }
                >
                  <legend className="text-sm font-semibold">
                    Dinner date and time
                  </legend>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        id: "dinner-date",
                        label: "Date",
                        type: "date",
                        value: date,
                        set: setDate,
                      },
                      {
                        id: "dinner-time",
                        label: "Time",
                        type: "time",
                        value: time,
                        set: setTime,
                      },
                    ].map((field) => (
                      <div key={field.id}>
                        <label htmlFor={field.id} className="sr-only">
                          {field.label}
                        </label>
                        <input
                          id={field.id}
                          type={field.type}
                          value={field.value}
                          required
                          step={field.type === "time" ? 900 : undefined}
                          aria-invalid={
                            errorField === "schedule" ? true : undefined
                          }
                          className="w-full rounded-2xl border border-ink/15 bg-cream/60 px-4 py-4 text-lg transition focus:border-herb focus:bg-white"
                          onChange={(event) =>
                            editDetails(() => field.set(event.target.value))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <p id="when-help" className="mt-2 text-sm text-ink/55">
                    One set time for the whole group, up to a year out. Check
                    that places are open then.
                  </p>
                </fieldset>
                {error && (
                  <p
                    id="details-error"
                    role="alert"
                    className="mt-3 text-sm font-medium text-tomato"
                  >
                    {error}
                  </p>
                )}

                <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    [
                      "💛",
                      "Share tastes",
                      "The organizer invites the group; everyone marks loves and skips.",
                    ],
                    [
                      "✨",
                      "Get a shortlist",
                      "Any skip is removed; favorites rise to the top.",
                    ],
                    [
                      "🗓️",
                      "Vote and save",
                      "Lock in the pick and add it to everyone's calendar.",
                    ],
                  ].map(([icon, title, text]) => (
                    <li key={title} className="rounded-2xl bg-cream/70 p-4">
                      <span aria-hidden className="text-2xl">
                        {icon}
                      </span>
                      <p className="mt-2 font-semibold">{title}</p>
                      <p className="mt-1 text-sm text-ink/60">{text}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex justify-end">
                  <button type="submit" className={primaryButton}>
                    Next: everyone&apos;s tastes <span aria-hidden>→</span>
                  </button>
                </div>
              </form>
            )}

            {step === 2 && activePerson && (
              <section className={card} aria-labelledby="tastes-heading">
                <StepHeading
                  number={2}
                  id="tastes-heading"
                  title="What's everyone craving?"
                  description="Pass the device around. Mark each cuisine Love, Open, or Skip; one skip removes it for everyone."
                />
                <div
                  role="group"
                  aria-label="Choose whose tastes to edit"
                  className="flex flex-wrap items-center gap-2"
                >
                  {people.map((person, index) => {
                    const active = person.id === activePerson.id;
                    return (
                      <button
                        key={person.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveId(person.id)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-ink bg-ink text-white" : "border-ink/15 bg-white hover:border-ink/40"}`}
                      >
                        <span
                          aria-hidden
                          className={`h-2 w-2 rounded-full ${hasInput(person) ? "bg-herb" : active ? "bg-white/40" : "bg-ink/20"}`}
                        />
                        Person {index + 1}
                        {index === 0 && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${active ? "bg-saffron text-ink" : "bg-saffron/30"}`}
                          >
                            Organizer
                          </span>
                        )}
                        <span className="sr-only">
                          {hasInput(person)
                            ? ", tastes added"
                            : ", no tastes yet"}
                        </span>
                      </button>
                    );
                  })}
                  <span className="ml-auto text-xs font-medium text-ink/50">
                    {people.length}/{maxParticipants} people
                  </span>
                </div>

                {organizerActive ? (
                  <section
                    aria-labelledby="invite-heading"
                    className="mt-4 rounded-[1.5rem] border border-herb/25 bg-herb/5 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3
                          id="invite-heading"
                          className="text-sm font-semibold"
                        >
                          Organizer: guest list
                        </h3>
                        <p className="text-xs text-ink/60" aria-live="polite">
                          {invitesLeft
                            ? `${invitesLeft} of ${maxInvites} invites left for a small party.`
                            : `Small party is full at ${maxParticipants} people.`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={inviteGuest}
                        disabled={invitesLeft === 0}
                        className="rounded-full bg-herb px-4 py-2 text-sm font-semibold text-white transition hover:bg-herb/90 disabled:cursor-not-allowed disabled:bg-ink/25"
                      >
                        + Invite a guest
                      </button>
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {guests.map((guest, index) => (
                        <li
                          key={guest.id}
                          className="flex items-center gap-1 rounded-full border border-ink/10 bg-white py-1 pl-3 pr-1 text-sm"
                        >
                          Person {index + 2}
                          <button
                            type="button"
                            onClick={() => removeGuest(guest.id)}
                            disabled={people.length <= minParticipants}
                            aria-label={`Remove Person ${index + 2}`}
                            className="grid h-6 w-6 place-items-center rounded-full text-ink/50 transition hover:bg-tomato/10 hover:text-tomato disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <span aria-hidden>×</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {people.length <= minParticipants && (
                      <p className="mt-2 text-xs text-ink/55">
                        You need at least one guest.
                      </p>
                    )}
                  </section>
                ) : (
                  <p className="mt-4 rounded-2xl bg-ink/5 px-4 py-3 text-xs text-ink/60">
                    <span aria-hidden>🔒</span> Only the organizer (Person 1)
                    can invite or remove people.
                  </p>
                )}

                <div className="mt-6 rounded-[1.5rem] bg-cream/70 p-4 sm:p-6">
                  <h3 className="font-display text-2xl font-semibold">
                    Person {activeIndex + 1}
                    {organizerActive && (
                      <span className="ml-2 align-middle text-sm font-sans font-semibold text-ink/50">
                        Organizer
                      </span>
                    )}
                  </h3>

                  <h4 className="mt-5 text-sm font-semibold">Cuisines</h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {cuisines.map((cuisine) => {
                      const selected = preferenceFor(activePerson, cuisine);
                      return (
                        <fieldset
                          key={cuisine}
                          className="rounded-2xl border border-ink/10 bg-white p-3"
                        >
                          <legend className="sr-only">{cuisine}</legend>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-3 font-semibold">
                              <span
                                aria-hidden
                                className="grid h-10 w-10 place-items-center rounded-xl bg-cream text-xl"
                              >
                                {cuisineIcons[cuisine]}
                              </span>
                              {cuisine}
                            </span>
                            <div className="ml-auto flex rounded-xl bg-ink/5 p-1">
                              {preferences.map((option) => (
                                <label
                                  key={option.value}
                                  className={`choice cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink/55 transition ${option.checked}`}
                                >
                                  <input
                                    type="radio"
                                    className="sr-only"
                                    name={`pref-${activePerson.id}-${cuisine}`}
                                    checked={selected === option.value}
                                    onChange={() =>
                                      setPreference(
                                        activePerson,
                                        cuisine,
                                        option.value,
                                      )
                                    }
                                  />
                                  {option.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        </fieldset>
                      );
                    })}
                  </div>

                  <fieldset className="mt-6">
                    <legend className="text-sm font-semibold">
                      Comfortable price per person
                    </legend>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {budgets.map((budget) => (
                        <label
                          key={budget}
                          className="choice cursor-pointer rounded-2xl border border-ink/10 bg-white p-3 text-center transition has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white"
                        >
                          <input
                            type="radio"
                            className="sr-only"
                            name={`budget-${activePerson.id}`}
                            checked={activePerson.budget === budget}
                            onChange={() =>
                              updatePerson(activePerson.id, { budget })
                            }
                          />
                          <span className="block font-display text-xl font-bold">
                            {budget}
                          </span>
                          <span className="block text-xs opacity-70">
                            {budgetLabels[budget]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="mt-6">
                    <legend className="text-sm font-semibold">
                      Dietary needs
                    </legend>
                    <p className="mt-1 text-xs text-ink/55">
                      Listed for the group to confirm with the restaurant. Menus
                      aren&apos;t verified.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dietaryNeeds.map((need) => {
                        const checked =
                          activePerson.dietaryNeeds.includes(need);
                        return (
                          <label
                            key={need}
                            className="choice cursor-pointer rounded-full border border-ink/15 bg-white px-3.5 py-2 text-sm font-medium transition has-[:checked]:border-herb has-[:checked]:bg-herb/10 has-[:checked]:text-herb"
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={(event) =>
                                updatePerson(activePerson.id, {
                                  dietaryNeeds: event.target.checked
                                    ? [...activePerson.dietaryNeeds, need]
                                    : activePerson.dietaryNeeds.filter(
                                        (item) => item !== need,
                                      ),
                                })
                              }
                            />
                            <span aria-hidden className="mr-1">
                              {checked ? "✓" : "+"}
                            </span>
                            {need}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <label
                    htmlFor={`notes-${activePerson.id}`}
                    className="mt-6 block text-sm font-semibold"
                  >
                    Anything else?
                  </label>
                  <textarea
                    id={`notes-${activePerson.id}`}
                    value={activePerson.notes}
                    maxLength={300}
                    rows={2}
                    placeholder="Outdoor seating, quiet enough to chat..."
                    className="mt-2 w-full resize-y rounded-2xl border border-ink/15 bg-white p-3 placeholder:text-ink/35 focus:border-herb"
                    onChange={(event) =>
                      updatePerson(activePerson.id, {
                        notes: event.target.value,
                      })
                    }
                  />
                  <p className="mt-1 text-xs text-ink/50">
                    Skip names and medical details.
                  </p>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="mt-4 text-sm font-medium text-tomato"
                  >
                    {error}
                  </p>
                )}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className={secondaryButton}
                    onClick={() => showStep(1)}
                  >
                    <span aria-hidden>←</span> Back
                  </button>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {activeIndex < people.length - 1 && (
                      <button
                        type="button"
                        className={secondaryButton}
                        onClick={() => setActiveId(people[activeIndex + 1].id)}
                      >
                        Next: Person {activeIndex + 2}
                      </button>
                    )}
                    <button
                      type="button"
                      className={primaryButton}
                      onClick={buildShortlist}
                    >
                      Build our shortlist <span aria-hidden>→</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {step === 3 && plan && voteSummary && (
              <div className="space-y-6">
                <section className={card} aria-labelledby="shortlist-heading">
                  <StepHeading
                    number={3}
                    id="shortlist-heading"
                    title="Your shortlist"
                    description={`${formatSchedule(plan.schedule)} in ${plan.area}. Ranked by favorites for ${plan.groupSize} people; anything someone skipped is already gone.`}
                  />
                  {plan.options.length === 0 ? (
                    <div
                      role="status"
                      className="rounded-[1.5rem] bg-cream/70 p-8 text-center"
                    >
                      <span aria-hidden className="text-5xl">
                        🤷
                      </span>
                      <h3 className="mt-3 font-display text-2xl font-semibold">
                        Everything got skipped.
                      </h3>
                      <p className="mx-auto mt-2 max-w-md text-ink/65">
                        Every cuisine was skipped by at least one person. Loosen
                        a few skips and try again.
                      </p>
                      <button
                        type="button"
                        className={`${primaryButton} mt-6`}
                        onClick={() => showStep(2)}
                      >
                        Revisit tastes
                      </button>
                    </div>
                  ) : (
                    <ol className="grid gap-4 md:grid-cols-3">
                      {plan.options.map((option, index) => {
                        const top = index === 0;
                        const voteCount =
                          voteSummary.totals.find(
                            (total) => total.cuisine === option.cuisine,
                          )?.votes ?? 0;
                        return (
                          <li
                            key={option.cuisine}
                            className={`flex flex-col rounded-[1.5rem] border p-5 ${top ? "border-ink bg-ink text-white" : "border-ink/10 bg-cream/60"}`}
                          >
                            <div className="flex items-start justify-between">
                              <span aria-hidden className="text-4xl">
                                {cuisineIcons[option.cuisine]}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${top ? "bg-saffron text-ink" : "bg-white text-ink/70"}`}
                              >
                                {top ? "Top match" : `#${index + 1}`}
                              </span>
                            </div>
                            <h3 className="mt-4 font-display text-2xl font-semibold">
                              {option.cuisine}
                            </h3>
                            <p
                              className={`mt-1 text-sm ${top ? "text-white/75" : "text-ink/60"}`}
                            >
                              {option.votes
                                ? `${option.votes} of ${plan.groupSize} love it`
                                : "No one's favorite, no one skipped it"}
                            </p>
                            <div
                              aria-hidden
                              className={`mt-3 h-2 overflow-hidden rounded-full ${top ? "bg-white/20" : "bg-ink/10"}`}
                            >
                              <div
                                className={`h-full rounded-full ${top ? "bg-saffron" : "bg-herb"}`}
                                style={{
                                  width: `${(option.votes / plan.groupSize) * 100}%`,
                                }}
                              />
                            </div>
                            <p className="mt-3 text-sm font-semibold">
                              {voteCount} {voteCount === 1 ? "vote" : "votes"}
                            </p>
                            <a
                              href={option.mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-auto pt-5 text-sm font-semibold underline underline-offset-4"
                            >
                              Browse places on Maps <span aria-hidden>↗</span>
                              <span className="sr-only">
                                {" "}
                                (opens in a new tab)
                              </span>
                            </a>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                  <p className="mt-4 text-xs text-ink/50">
                    Maps links search Google for the cuisine, price range, and
                    area only. Results aren&apos;t verified for price, hours, or
                    dietary needs.
                  </p>
                </section>

                {plan.options.length > 0 && (
                  <section className={card} aria-labelledby="vote-heading">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-tomato">
                          Group vote
                        </p>
                        <h2
                          id="vote-heading"
                          className="mt-2 font-display text-3xl font-semibold tracking-tight"
                        >
                          Pass the phone, cast your votes
                        </h2>
                        <p className="mt-2 text-ink/65">
                          One vote each. Change it anytime before you lock it
                          in.
                        </p>
                      </div>
                      <p className="shrink-0 self-start rounded-full bg-herb/10 px-4 py-2 text-sm font-semibold text-herb sm:self-auto">
                        {voteSummary.votesCast}/{plan.groupSize} voted
                      </p>
                    </div>

                    <div className="mt-6 space-y-3">
                      {votes.map((vote, index) => (
                        <fieldset
                          key={index}
                          className="rounded-2xl border border-ink/10 p-3"
                        >
                          <legend className="sr-only">
                            Person {index + 1}&apos;s vote
                          </legend>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <span
                              aria-hidden
                              className="w-24 shrink-0 text-sm font-semibold"
                            >
                              Person {index + 1}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {[
                                ...plan.options.map((option) => option.cuisine),
                                null,
                              ].map((choice) => (
                                <label
                                  key={choice ?? "none"}
                                  className="choice cursor-pointer rounded-full border border-ink/15 px-3.5 py-2 text-sm font-medium transition has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white"
                                >
                                  <input
                                    type="radio"
                                    className="sr-only"
                                    name={`vote-${index}`}
                                    checked={vote === choice}
                                    onChange={() => updateVote(index, choice)}
                                  />
                                  {choice ? (
                                    <>
                                      <span aria-hidden>
                                        {cuisineIcons[choice]}
                                      </span>{" "}
                                      {choice}
                                    </>
                                  ) : (
                                    "Not yet"
                                  )}
                                </label>
                              ))}
                            </div>
                          </div>
                        </fieldset>
                      ))}
                    </div>

                    <div className="mt-6 rounded-[1.5rem] bg-cream/70 p-5">
                      <h3 className="text-sm font-semibold">Live tally</h3>
                      <ul className="mt-3 space-y-3" aria-label="Vote totals">
                        {voteSummary.totals.map((total) => (
                          <li key={total.cuisine}>
                            <div className="flex justify-between text-sm">
                              <span>
                                <span aria-hidden>
                                  {cuisineIcons[total.cuisine]}
                                </span>{" "}
                                {total.cuisine}
                              </span>
                              <span className="font-semibold">
                                {total.votes}{" "}
                                {total.votes === 1 ? "vote" : "votes"}
                              </span>
                            </div>
                            <div
                              aria-hidden
                              className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ink/10"
                            >
                              <div
                                className={`h-full rounded-full transition-all ${leaders.includes(total.cuisine) ? "bg-tomato" : "bg-ink/30"}`}
                                style={{
                                  width: `${voteSummary.votesCast ? (total.votes / voteSummary.votesCast) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {leaders.length > 1 && (
                      <fieldset className="mt-5 rounded-2xl border border-saffron bg-saffron/15 p-4">
                        <legend className="px-1 text-sm font-semibold">
                          It&apos;s a tie. Organizer, break it:
                        </legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {leaders.map((leader) => (
                            <label
                              key={leader}
                              className="choice cursor-pointer rounded-full border border-ink/20 bg-white px-3.5 py-2 text-sm font-medium transition has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white"
                            >
                              <input
                                type="radio"
                                className="sr-only"
                                name="tie-choice"
                                checked={tieChoice === leader}
                                onChange={() => {
                                  setTieChoice(leader);
                                  setFinalChoice(null);
                                }}
                              />
                              <span aria-hidden>{cuisineIcons[leader]}</span>{" "}
                              {leader}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    )}

                    <button
                      type="button"
                      disabled={!decision}
                      className={`${primaryButton} mt-6 w-full`}
                      onClick={() => setFinalChoice(decision)}
                    >
                      Lock in the group&apos;s pick
                    </button>
                    {!decision && (
                      <p className="mt-2 text-center text-xs text-ink/55">
                        {voteSummary.votesCast === 0
                          ? "Cast at least one vote to lock in a pick."
                          : "Choose a tie-break option to lock in a pick."}
                      </p>
                    )}
                  </section>
                )}

                {finalOption && (
                  <section
                    role="status"
                    className="relative overflow-hidden rounded-[2rem] bg-herb p-8 text-white sm:p-10"
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-saffron/40 blur-3xl"
                    />
                    <div className="relative">
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/75">
                        It&apos;s decided
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <span aria-hidden className="text-6xl">
                          {cuisineIcons[finalOption.cuisine]}
                        </span>
                        <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                          {finalOption.cuisine} it is!
                        </h2>
                      </div>
                      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 font-semibold">
                        <span aria-hidden>🗓️</span>{" "}
                        {formatSchedule(plan.schedule)} · {plan.area}
                      </p>
                      <p className="mt-4 max-w-xl text-white/85">
                        Pick a specific spot together and call ahead to confirm
                        they&apos;re open then, plus
                        {plan.dietaryNeeds.length
                          ? ` ${plan.dietaryNeeds.join(", ")} options, `
                          : " "}
                        prices, and seating for {plan.groupSize}.
                      </p>
                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={downloadCalendar}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-saffron px-5 py-3.5 font-semibold text-ink transition hover:-translate-y-0.5"
                        >
                          <span aria-hidden>＋</span> Add to calendar (.ics)
                        </button>
                        <a
                          href={finalOption.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 font-semibold text-herb transition hover:-translate-y-0.5"
                        >
                          Find {finalOption.cuisine} places on Maps{" "}
                          <span aria-hidden>↗</span>
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      </div>
                    </div>
                  </section>
                )}

                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => showStep(2)}
                >
                  <span aria-hidden>←</span> Edit tastes
                </button>
              </div>
            )}
          </div>

          <aside
            aria-label="Group snapshot"
            className="space-y-4 lg:sticky lg:top-24"
          >
            <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-[0_24px_60px_-42px_rgba(28,25,23,0.55)]">
              <h2 className="font-display text-xl font-semibold">
                Group snapshot
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  ["Area", area.trim() || "Not set yet"],
                  ["When", when ?? "Not set yet"],
                  ["People", `${people.length} · ${readyCount} with tastes`],
                  [
                    "Guests",
                    `${guests.length} invited · ${invitesLeft} spots left`,
                  ],
                  [
                    "Price",
                    `${groupBudget} · ${budgetLabels[groupBudget].toLowerCase()}`,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-ink/55">{label}</dt>
                    <dd className="text-right font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-ink/45">
                Price uses the lowest range anyone picked.
              </p>
              <div className="mt-5 border-t border-ink/10 pt-4">
                <h3 className="text-sm font-semibold">
                  Confirm with the restaurant
                </h3>
                {groupNeeds.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {groupNeeds.map((need) => (
                      <li
                        key={need}
                        className="rounded-full bg-herb/10 px-3 py-1 text-xs font-semibold text-herb"
                      >
                        {need}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink/55">
                    No dietary needs added yet.
                  </p>
                )}
                {groupNotes.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-sm text-ink/70">
                    {groupNotes.map((note) => (
                      <li key={note.person}>
                        <span className="font-semibold">
                          Person {note.person}:
                        </span>{" "}
                        {note.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-saffron/60 bg-saffron/15 p-5 text-sm">
              <p className="font-semibold">Allergies are serious.</p>
              <p className="mt-1 text-ink/70">
                Table Sync doesn&apos;t check menus. Always confirm allergens
                and dietary needs directly with the restaurant.
              </p>
            </div>
            <p className="px-2 text-xs text-ink/50">
              Everything stays in this browser tab and clears on refresh.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}
