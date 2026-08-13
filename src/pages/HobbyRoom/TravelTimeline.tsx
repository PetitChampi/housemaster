import { useEffect, useMemo, useRef, useState } from "react";
import { Fence, Grass, Hiker, Hills, Mountains, Oak, Pine } from "@/pages/HobbyRoom/TravelLogArt";
import { formatVisit, layoutTimeline } from "@/pages/HobbyRoom/travelLogLogic";
import { TIMELINE_START, type Place } from "@/pages/HobbyRoom/travelLogData";

// The strip repeats these along the line, in the order they cycle
const SCENERY = [Pine, Hills, Oak, Grass, Mountains, Fence] as const;

// Narrow windows scroll instead of squashing -> width below which the gaps stop reading as gaps
const MIN_TRACK = 940;
// Where the line itself begins, with the opening year under it
const AXIS_START = 84;
// Markers start further in than the line does
const PAD_START = 124;
// Leaves some room for the arrowhead and the walker at the end of the line
const PAD_END = 140;
const MIN_GAP = 58;
const SCENERY_STEP = 126;

interface TravelTimelineProps {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const TravelTimeline = ({ places, selectedId, onSelect }: TravelTimelineProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(
    () =>
      layoutTimeline(places, {
        startYear: TIMELINE_START,
        endYear: currentYear,
        width: Math.max(available, MIN_TRACK),
        minGap: MIN_GAP,
        padStart: PAD_START,
        padEnd: PAD_END,
      }),
    [places, currentYear, available]
  );

  // Pieces cycle in a fixed order at a size that varies with position, so the strip stays put between renders
  const scenery = useMemo(() => {
    const items: { Art: (typeof SCENERY)[number]; left: number; scale: number }[] = [];
    const until = layout.width - PAD_END;
    for (let index = 0; AXIS_START + index * SCENERY_STEP < until; index += 1) {
      items.push({
        Art: SCENERY[index % SCENERY.length],
        left: AXIS_START + index * SCENERY_STEP,
        scale: 0.72 + ((index * 5) % 4) * 0.13,
      });
    }
    return items;
  }, [layout.width]);

  // Prev/next can pick a marker that is off the side of a scrolling track
  useEffect(() => {
    if (!selectedId) return;
    trackRef.current
      ?.querySelector(`[data-place-id="${selectedId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedId]);

  return (
    <div className="tl-timeline-scroll" ref={scrollRef}>
      <div className="tl-track" ref={trackRef} style={{ width: layout.width }}>
        <div className="tl-scenery" aria-hidden="true">
          {scenery.map((item, index) => (
            <span
              className="tl-scenery-piece"
              key={index}
              style={{ left: item.left, transform: `scale(${item.scale})` }}
            >
              <item.Art />
            </span>
          ))}
          <span className="tl-scenery-hiker">
            <Hiker />
          </span>
        </div>

        <div className="tl-axis" aria-hidden="true">
          <span className="tl-axis-dot" style={{ left: AXIS_START }} />
          <span className="tl-axis-line" style={{ left: AXIS_START, right: PAD_END }} />
          <span className="tl-axis-arrow" style={{ right: PAD_END - 16 }} />
        </div>

        <p className="tl-axis-year" style={{ left: AXIS_START }}>
          {TIMELINE_START}
        </p>
        <p className="tl-axis-year tl-axis-year--end" style={{ right: PAD_END - 16 }}>
          {currentYear}
        </p>

        <div className="tl-marks">
          {places.map((place, index) => (
            <button
              key={place.id}
              className={`tl-pin tl-pin--hanging${place.id === selectedId ? " is-selected" : ""}`}
              data-place-id={place.id}
              style={{ left: layout.positions[index] }}
              aria-label={`${place.name}, ${formatVisit(place)}`}
              aria-pressed={place.id === selectedId}
              onClick={() => onSelect(place.id)}
            >
              <span className="tl-pin-shape" />
              <span className="tl-pin-tip">
                <span className="tl-pin-tip-name">{place.name}</span>
                <span className="tl-pin-tip-when">{formatVisit(place)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TravelTimeline;
