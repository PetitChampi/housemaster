import { useCallback, useMemo, useState } from "react";
import { IconX } from "@tabler/icons-react";
import PlacePanel from "@/pages/HobbyRoom/PlacePanel";
import TravelMap from "@/pages/HobbyRoom/TravelMap";
import TravelTimeline from "@/pages/HobbyRoom/TravelTimeline";
import { places } from "@/pages/HobbyRoom/travelLogData";
import { sortByVisit } from "@/pages/HobbyRoom/travelLogLogic";
import "@/styles/tools/TravelLog.css";

type ViewId = "map" | "timeline";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "map", label: "Map" },
  { id: "timeline", label: "Timeline" },
];

const PANEL_MARGIN = 40;

const TravelLog = () => {
  const ordered = useMemo(() => sortByVisit(places), []);
  const [view, setView] = useState<ViewId>("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelInset, setPanelInset] = useState(0);

  const index = ordered.findIndex((place) => place.id === selectedId);
  const selected = index >= 0 ? ordered[index] : null;

  const measurePanel = useCallback((node: HTMLElement | null) => {
    setPanelInset(node ? node.getBoundingClientRect().width + PANEL_MARGIN : 0);
  }, []);

  const choose = (id: string) => {
    setSelectedId(id);
    setPanelOpen(true);
  };
  const step = (delta: number) => {
    const next = ordered[index + delta];
    if (next) choose(next.id);
  };

  const panel = (layout: "side" | "foot") => (
    <PlacePanel
      place={selected}
      layout={layout}
      hasPrev={index > 0}
      hasNext={index >= 0 && index < ordered.length - 1}
      onPrev={() => step(-1)}
      onNext={() => step(1)}
      onStart={() => ordered[0] && choose(ordered[0].id)}
      className={layout === "side" && !panelOpen ? "is-hidden" : undefined}
      ref={layout === "side" ? measurePanel : undefined}
    />
  );

  return (
    <div className="travel-log">
      <div className="tl-stage">
        {view === "map" ? (
          <TravelMap places={ordered} selectedId={selectedId} onSelect={choose} panelInset={panelInset} />
        ) : (
          <TravelTimeline places={ordered} selectedId={selectedId} onSelect={choose} />
        )}
      </div>

      <div className="tl-tabs" role="tablist" aria-label="Travel log view">
        {VIEWS.map((entry) => (
          <button
            key={entry.id}
            className={`tl-tab${view === entry.id ? " is-active" : ""}`}
            role="tab"
            aria-selected={view === entry.id}
            onClick={() => setView(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {view === "map" ? (
        <>
          {panel("side")}
          {/* One button that slides across the panel so the cross can rotate into a plus without remounting */}
          <button
            className={`tl-panel-toggle${panelOpen ? " is-open" : ""}`}
            aria-expanded={panelOpen}
            aria-label={panelOpen ? "Close panel" : "Open panel"}
            onClick={() => setPanelOpen((open) => !open)}
          >
            <span className="tl-panel-toggle-label" aria-hidden="true">
              Open panel
            </span>
            <IconX className="tl-panel-toggle-icon" size={20} stroke={2} />
          </button>
        </>
      ) : (
        panel("foot")
      )}
    </div>
  );
};

export default TravelLog;
