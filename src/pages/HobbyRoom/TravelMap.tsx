import { useCallback, useEffect, useRef, useState } from "react";
import { IconFocusCentered, IconMinus, IconPlus } from "@tabler/icons-react";
import { WORLD_LAND_PATH } from "@/pages/HobbyRoom/worldLand";
import { clamp, formatVisit, projectToMap } from "@/pages/HobbyRoom/travelLogLogic";
import type { Place } from "@/pages/HobbyRoom/travelLogData";

// Latitudes to crop the land path to. Plate carree stretches the poles badly, and nobody holidays in Antarctica.
const MAP_TOP = 6;
const MAP_BOTTOM = 148;
const MIN_SPAN = 6;
const MAX_SPAN = 360;
// Framed on France, where most of the log is
const HOME_VIEW = { cx: 182.5, cy: 43.5, span: 42 };
const ZOOM_STEP = 1.45;
const WHEEL_STEP = 1.12;

interface View {
  cx: number;
  cy: number;
  span: number;
}

const clampView = (view: View): View => ({
  span: clamp(view.span, MIN_SPAN, MAX_SPAN),
  cx: clamp(view.cx, 0, 360),
  cy: clamp(view.cy, MAP_TOP, MAP_BOTTOM),
});

// Canvas sliced to fill, so scales from the longer side and its viewBox centre lands on the element centre
// Markers laid over the top in HTML rather than drawn into the SVG -> keeps them real buttons at a fixed size
const scaleFor = (width: number, height: number, span: number) => Math.max(width, height) / span;

interface TravelMapProps {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  // Width of the panel sitting over the map's left edge. Keeps a chosen place from landing behind it.
  panelInset: number;
}

const TravelMap = ({ places, selectedId, onSelect, panelInset }: TravelMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const teardown = useRef<(() => void) | null>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<View>(HOME_VIEW);
  const [panning, setPanning] = useState(false);
  const [lastSelected, setLastSelected] = useState(selectedId);

  // Bring a place picked from the panel into frame, since prev/next can easily land on a marker that is off screen
  if (selectedId !== lastSelected) {
    setLastSelected(selectedId);
    const place = places.find((entry) => entry.id === selectedId);
    if (place) {
      const point = projectToMap(place.lat, place.lng);
      setView((current) => {
        const span = Math.min(current.span, 60);
        const scale = scaleFor(box.width, box.height, span);
        // Half the covered width puts the marker in the middle of what you can actually see
        const shift = scale > 0 ? panelInset / (2 * scale) : 0;
        return clampView({ cx: point.x - shift, cy: point.y, span });
      });
    }
  }

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const zoomTo = useCallback((factor: number, clientX?: number, clientY?: number) => {
    setView((current) => {
      const span = clamp(current.span * factor, MIN_SPAN, MAX_SPAN);
      if (span === current.span) return current;
      const element = containerRef.current;
      if (!element || clientX === undefined || clientY === undefined) {
        return clampView({ ...current, span });
      }
      const rect = element.getBoundingClientRect();
      const scale = scaleFor(rect.width, rect.height, current.span);
      // Hold whatever's under the pointer while the rest of the map grows around it
      const anchorX = current.cx + (clientX - rect.left - rect.width / 2) / scale;
      const anchorY = current.cy + (clientY - rect.top - rect.height / 2) / scale;
      const ratio = span / current.span;
      return clampView({
        cx: anchorX + (current.cx - anchorX) * ratio,
        cy: anchorY + (current.cy - anchorY) * ratio,
        span,
      });
    });
  }, []);

  // Added by hand because React's onWheel is passive, so it can't call preventDefault
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoomTo(event.deltaY > 0 ? WHEEL_STEP : 1 / WHEEL_STEP, event.clientX, event.clientY);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [zoomTo]);

  // Makes sure window listeners are cleaned up even if the component is unmounted while a pan is in progress
  // The pointerup/pointercancel handlers also clean themselves up so this is only a backup
  useEffect(() => () => teardown.current?.(), []);

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    if (target.closest(".tl-pin") || target.closest(".tl-map-controls")) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const element = event.currentTarget;
    // How much map one pixel of drag moves, measured once since you can't zoom midway through a drag
    const scale = scaleFor(element.clientWidth, element.clientHeight, view.span);
    let lastX = event.clientX;
    let lastY = event.clientY;

    const onMove = (move: PointerEvent) => {
      if (move.pointerId !== event.pointerId) return;
      const dx = (move.clientX - lastX) / scale;
      const dy = (move.clientY - lastY) / scale;
      lastX = move.clientX;
      lastY = move.clientY;
      setView((current) => clampView({ ...current, cx: current.cx - dx, cy: current.cy - dy }));
    };
    const finish = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      teardown.current = null;
      setPanning(false);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    teardown.current = finish;
    setPanning(true);
  };

  const scale = scaleFor(box.width, box.height, view.span);

  return (
    <div
      className={`tl-map${panning ? " is-panning" : ""}`}
      ref={containerRef}
      onPointerDown={startPan}
    >
      <svg
        className="tl-map-canvas"
        viewBox={`${view.cx - view.span / 2} ${view.cy - view.span / 2} ${view.span} ${view.span}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path className="tl-map-land" d={WORLD_LAND_PATH} vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="tl-pins">
        {box.width > 0 &&
          places.map((place) => {
            const point = projectToMap(place.lat, place.lng);
            return (
              <button
                key={place.id}
                className={`tl-pin${place.id === selectedId ? " is-selected" : ""}`}
                style={{
                  left: box.width / 2 + (point.x - view.cx) * scale,
                  top: box.height / 2 + (point.y - view.cy) * scale,
                }}
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
            );
          })}
      </div>

      <div className="tl-map-controls">
        <button className="tl-map-control" aria-label="Zoom in" onClick={() => zoomTo(1 / ZOOM_STEP)}>
          <IconPlus size={18} stroke={2} />
        </button>
        <button className="tl-map-control" aria-label="Zoom out" onClick={() => zoomTo(ZOOM_STEP)}>
          <IconMinus size={18} stroke={2} />
        </button>
        <button
          className="tl-map-control"
          aria-label="Back to the starting view"
          onClick={() => setView(HOME_VIEW)}
        >
          <IconFocusCentered size={18} stroke={1.75} />
        </button>
      </div>
    </div>
  );
};

export default TravelMap;
