const plannedFeatures = [
  {
    number: 2,
    title: "Taste profile creation",
    description: "Swipe or rate foods, cuisines, and restaurants to build a personal taste profile.",
    preview: "Reserved for food cards, swipe actions, and ratings.",
    current: "Today: cuisine favorites and skips are entered by the organizer for this outing only.",
  },
  {
    number: 3,
    title: "Dietary restriction collection",
    description: "Collect dietary restrictions and food allergies, including vegetarian, vegan, gluten-free, and nut allergies.",
    preview: "Reserved for separate restriction and allergy fields.",
    current: "Today: dietary quick picks form a checklist. Dedicated allergy collection is not implemented; restaurant safety must be confirmed directly.",
  },
  {
    number: 4,
    title: "Location gathering",
    description: "Let participants suggest search locations or agree on a group meeting area.",
    preview: "Reserved for participant locations and a shared meeting-area selector.",
    current: "Today: the organizer enters one public search area. Participant location submissions are not implemented.",
  },
  {
    number: 5,
    title: "Restaurant data retrieval",
    description: "Retrieve currently open restaurants within a configurable distance of the selected location.",
    preview: "Reserved for a distance control, open-now filter, and live restaurant cards.",
    current: "Requires a restaurant data provider and location lookup. Current Maps links do not verify distance or opening status.",
  },
  {
    number: 6,
    title: "Group recommendation engine",
    description: "Shortlist restaurants using participant tastes, dietary restrictions, location, and availability.",
    preview: "Reserved for ranked restaurant recommendations.",
    current: "Today: only cuisines are ranked by favorites and skips. Venue ranking requires restaurant data; dietary suitability is not verified.",
  },
  {
    number: 7,
    title: "Recommendation explanation",
    description: "Explain each recommendation with preference-match counts and supported dietary options when backed by data.",
    preview: "Reserved for restaurant match reasons and dietary-information sources.",
    current: "Today: cuisine cards show favorite counts. Restaurant-specific explanations await actual venue data.",
  },
  {
    number: 8,
    title: "Group voting",
    description: "Let participants vote on the recommended restaurants.",
    preview: "Reserved for participant voting controls and vote totals.",
    current: "Not implemented. Independent voting across devices requires shared group storage and participant identification.",
  },
  {
    number: 9,
    title: "Final decision selection",
    description: "Choose a final restaurant by majority vote, host selection, or an AI-selected recommendation.",
    preview: "Reserved for a decision-method selector and final-choice confirmation.",
    current: "Not implemented. Voting rules, ties, host permissions, and any AI integration still need to be defined.",
  },
  {
    number: 10,
    title: "Results sharing",
    description: "Display and share the chosen restaurant's name, address, hours, and directions with all participants.",
    preview: "Reserved for a final restaurant card, directions, and group sharing.",
    current: "Not implemented. Verified venue details require restaurant data; shared group results require persistent storage.",
  },
];

export default function PlannedFeatures() {
  return (
    <section id="coming-next" aria-labelledby="planned-features-heading" className="mt-16 border-t border-stone-200 pt-10">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-800">Coming next</p>
      <h2 id="planned-features-heading" className="mt-3 text-3xl font-semibold tracking-tight">Space for the full group-dining journey.</h2>
      <p className="mt-4 max-w-3xl text-stone-600">
        Requirements 2–10 are outlined below for team discussion. These are planned UI spaces, not working features.
        The current organizer-led preference form and Maps searches above are still available.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plannedFeatures.map((feature) => (
          <article key={feature.number} aria-labelledby={`requirement-${feature.number}`} className="flex flex-col rounded-3xl border border-stone-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Requirement {feature.number}</p>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Planned</span>
            </div>
            <h3 id={`requirement-${feature.number}`} className="mt-4 text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-stone-600">{feature.description}</p>
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-500">
              {feature.preview}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-stone-600">{feature.current}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
