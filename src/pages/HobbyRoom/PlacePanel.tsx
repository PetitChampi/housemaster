import type { Ref } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconFlower,
  IconLeaf,
  IconSnowflake,
  IconSun,
  type Icon,
} from "@tabler/icons-react";
import { Hiker, Trail } from "@/pages/HobbyRoom/TravelLogArt";
import { formatVisit } from "@/pages/HobbyRoom/travelLogLogic";
import type { Place, Season } from "@/pages/HobbyRoom/travelLogData";

const SEASON_ICON: Record<Season, Icon> = {
  spring: IconFlower,
  summer: IconSun,
  autumn: IconLeaf,
  winter: IconSnowflake,
};

interface PlacePanelProps {
  place: Place | null;
  layout: "side" | "foot";
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onStart: () => void;
  className?: string;
  ref?: Ref<HTMLElement>;
}

const PlacePanel = ({
  place,
  layout,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onStart,
  className,
  ref,
}: PlacePanelProps) => {
  const SeasonMark = place ? SEASON_ICON[place.season] : null;

  return (
    <section
      className={`tl-panel tl-panel--${layout}${className ? ` ${className}` : ""}`}
      aria-label="Travel log"
      ref={ref}
    >
      {place ? (
        <div className="tl-place">
          <header className="tl-place-head">
            <h2 className="tl-place-name">{place.name}</h2>
            <p className="tl-place-where">{place.country}</p>
            <p className="tl-place-when">
              {SeasonMark && <SeasonMark size={17} stroke={1.75} />}
              {formatVisit(place)}
            </p>
          </header>
          <figure className="tl-place-figure">
            <img src={place.imageUrl} alt="" />
          </figure>
          <p className="tl-place-note">{place.description}</p>
          <div className="tl-place-nav">
            <button
              className="tl-btn tl-btn-ghost"
              aria-label="Previous place"
              disabled={!hasPrev}
              onClick={onPrev}
            >
              <IconArrowLeft size={18} stroke={1.75} />
              Previous
            </button>
            <button className="tl-btn tl-btn-ghost" aria-label="Next place" disabled={!hasNext} onClick={onNext}>
              Next
              <IconArrowRight size={18} stroke={1.75} />
            </button>
          </div>
        </div>
      ) : (
        <div className="tl-welcome">
          <div className="tl-welcome-art" aria-hidden="true">
            <Trail className="tl-welcome-trail" />
            <Hiker className="tl-welcome-hiker" />
          </div>
          <div className="tl-welcome-head">
            <h2 className="tl-welcome-title">Places I&rsquo;ve been</h2>
            <p className="tl-welcome-blurb">
              Every trip worth remembering, pinned where it happened. Pick one to read about it, or start at
              the beginning and work forwards.
            </p>
          </div>
          <button className="tl-btn tl-btn-strong tl-welcome-start" onClick={onStart}>
            Start exploring
            <IconArrowRight size={19} stroke={1.75} />
          </button>
        </div>
      )}
    </section>
  );
};

export default PlacePanel;
