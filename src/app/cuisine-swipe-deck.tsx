import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  cuisines,
  type Cuisine,
  type CuisinePreference,
  type DiningParticipant,
} from "@/lib/social-dining";

export function CuisineSwipeDeck({
  person,
  reviewed,
  icons,
  onChoose,
}: {
  person: DiningParticipant;
  reviewed: readonly Cuisine[];
  icons: Record<Cuisine, string>;
  onChoose: (cuisine: Cuisine, preference: CuisinePreference) => void;
}) {
  const [index, setIndex] = useState(() => {
    const next = cuisines.findIndex((cuisine) => !reviewed.includes(cuisine));
    return next === -1 ? cuisines.length : next;
  });
  const [drag, setDrag] = useState(0);
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const completion = useRef<HTMLParagraphElement>(null);
  const cuisine = cuisines[index];

  useEffect(() => {
    if (!cuisine) completion.current?.focus();
  }, [cuisine]);

  function preferenceFor(choice: Cuisine) {
    if (!reviewed.includes(choice)) return "Not answered";
    if (person.liked.includes(choice)) return "Love";
    return person.avoided.includes(choice) ? "Skip" : "Open";
  }

  function choose(preference: CuisinePreference) {
    if (!cuisine) return;
    onChoose(cuisine, preference);
    gesture.current = null;
    setDrag(0);
    const next = cuisines.findIndex(
      (choice, position) => position > index && !reviewed.includes(choice),
    );
    setIndex(next === -1 ? cuisines.length : next);
  }

  function finishGesture(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    setDrag(0);
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const threshold = Math.min(80, event.currentTarget.clientWidth * 0.25);
    if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy)) {
      choose(dx > 0 ? "love" : "skip");
    }
  }

  return (
    <section className="mt-5" aria-label="Cuisine preferences">
      <div className="flex items-center justify-between gap-3 text-sm">
        <h4 className="font-semibold">Cuisines</h4>
        <p role="status">
          {reviewed.length} of {cuisines.length} answered
        </p>
      </div>
      <p id="swipe-help" className="mt-2 text-sm text-ink/60">
        Swipe left to Skip or right to Love, or use the buttons. Open means
        you&apos;re happy either way. One Skip removes a cuisine for everyone.
      </p>
      {cuisine ? (
        <>
          <div className="mt-4 overflow-hidden rounded-[1.5rem] p-2">
            <div
              role="group"
              aria-label={`${cuisine} preference`}
              aria-describedby="swipe-help swipe-keys"
              aria-keyshortcuts="ArrowLeft ArrowDown ArrowRight"
              tabIndex={0}
              className="swipe-card relative flex min-h-64 cursor-grab touch-pan-y select-none flex-col items-center justify-center rounded-[1.5rem] border border-ink/10 bg-white p-6 text-center shadow-sm active:cursor-grabbing"
              style={{
                transform: `translateX(${drag}px) rotate(${drag / 20}deg)`,
              }}
              onPointerDown={(event) => {
                if (!event.isPrimary || event.button !== 0) return;
                gesture.current = {
                  id: event.pointerId,
                  x: event.clientX,
                  y: event.clientY,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const start = gesture.current;
                if (!start || start.id !== event.pointerId) return;
                const dx = event.clientX - start.x;
                const dy = event.clientY - start.y;
                setDrag(
                  Math.abs(dx) > Math.abs(dy)
                    ? Math.max(-120, Math.min(120, dx))
                    : 0,
                );
              }}
              onPointerUp={finishGesture}
              onPointerCancel={() => {
                gesture.current = null;
                setDrag(0);
              }}
              onLostPointerCapture={() => {
                gesture.current = null;
                setDrag(0);
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget || event.repeat)
                  return;
                const preference =
                  event.key === "ArrowLeft"
                    ? "skip"
                    : event.key === "ArrowRight"
                      ? "love"
                      : event.key === "ArrowDown"
                        ? "open"
                        : null;
                if (preference) {
                  event.preventDefault();
                  choose(preference);
                }
              }}
            >
              <span
                aria-hidden
                className={`absolute top-4 rounded-full px-3 py-1 text-sm font-bold ${drag < 0 ? "left-4 bg-tomato/10 text-tomato" : "right-4 bg-herb/10 text-herb"}`}
                style={{ opacity: Math.min(1, Math.abs(drag) / 80) }}
              >
                {drag < 0 ? "Skip" : "Love"}
              </span>
              <span aria-hidden className="text-7xl">
                {icons[cuisine]}
              </span>
              <h5 className="mt-4 font-display text-3xl font-semibold">
                {cuisine}
              </h5>
              <p className="mt-2 text-sm text-ink/55">
                {preferenceFor(cuisine)}
              </p>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            {cuisine}. {preferenceFor(cuisine)}.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["skip", "open", "love"] as const).map((preference) => (
              <button
                key={preference}
                type="button"
                onClick={() => choose(preference)}
                className={`rounded-2xl border px-3 py-3 font-semibold capitalize transition hover:-translate-y-0.5 motion-reduce:transform-none ${preference === "love" ? "border-herb bg-herb text-white" : preference === "skip" ? "border-tomato/25 bg-tomato/10 text-tomato" : "border-ink/15 bg-white text-ink"}`}
              >
                {preference}
              </button>
            ))}
          </div>
          <p id="swipe-keys" className="mt-2 text-center text-xs text-ink/55">
            Keyboard on card: left = Skip, down = Open, right = Love.
          </p>
        </>
      ) : (
        <p
          ref={completion}
          tabIndex={-1}
          role="status"
          className="mt-4 rounded-2xl bg-herb/10 p-4 font-semibold text-herb"
        >
          All cuisines answered. Review your choices below.
        </p>
      )}
      {reviewed.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-ink/55">Tap a choice to change it.</p>
          <ul
            className="mt-2 flex flex-wrap gap-2"
            aria-label="Review cuisine choices"
          >
            {cuisines.map((choice, position) =>
              reviewed.includes(choice) ? (
                <li key={choice}>
                  <button
                    type="button"
                    onClick={() => setIndex(position)}
                    aria-label={`Edit ${choice}: ${preferenceFor(choice)}`}
                    className="rounded-full border border-ink/15 bg-white px-3 py-2 text-xs font-medium hover:border-ink/40"
                  >
                    {choice}: {preferenceFor(choice)}
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
