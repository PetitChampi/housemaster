import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

// Drag and drop built on Pointer Events, so mouse, touch and pen all in one
// HTML5 drag events are never fired by touch on iOS Safari or Chrome for Android, which is why this exists rather than the draggable attribute

const MOUSE_THRESHOLD = 6; // px of travel before a mouse drag arms
const TOUCH_HOLD_MS = 220; // rest time before a touch drag arms, so taps and scrolls still reach the browser
const TOUCH_SLOP = 10; // px of travel during the hold that hands the gesture back as a scroll
const EDGE = 64; // distance from a scroll container's edge that starts auto-scrolling
const EDGE_SPEED = 16; // px per frame of auto-scroll

export interface DragSize {
  width: number;
  height: number;
}

interface PointerDragOptions<P, T> {
  // Maps whatever is under the pointer to a drop target (null when nothing droppable there)
  resolveTarget: (element: Element, x: number, y: number) => T | null;
  onDrop: (payload: P, target: T | null) => void;
  // Element the floating preview is positioned inside.
  // Needed because an ancestor with backdrop-filter (the tool window) becomes the containing block for fixed positioning, so viewport coordinates don't apply
  originRef?: RefObject<HTMLElement | null>;
}

interface Session<P, T> {
  payload: P;
  pointerId: number;
  isTouch: boolean;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  originX: number;
  originY: number;
  x: number;
  y: number;
  armed: boolean;
  hold: number;
  frame: number;
  target: T | null;
  targetKey: string;
}

// Scrolls any scrollable ancestor the pointer is hovering near the edge of, so a drag can reach off-screen columns
function autoScroll(from: Element, x: number, y: number) {
  let node: Element | null = from;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    const canX = /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth;
    const canY = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
    if (canX || canY) {
      const rect = node.getBoundingClientRect();
      if (canX) {
        if (x < rect.left + EDGE) node.scrollLeft -= EDGE_SPEED;
        else if (x > rect.right - EDGE) node.scrollLeft += EDGE_SPEED;
      }
      if (canY) {
        if (y < rect.top + EDGE) node.scrollTop -= EDGE_SPEED;
        else if (y > rect.bottom - EDGE) node.scrollTop += EDGE_SPEED;
      }
    }
    node = node.parentElement;
  }
}

export function usePointerDrag<P, T>({ resolveTarget, onDrop, originRef }: PointerDragOptions<P, T>) {
  const [active, setActive] = useState<{ payload: P; size: DragSize } | null>(null);
  const [target, setTarget] = useState<T | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const session = useRef<Session<P, T> | null>(null);
  const teardown = useRef<(() => void) | null>(null);

  // Held in refs so a drag in flight always calls the latest closures without re-attaching its listeners
  const resolve = useRef(resolveTarget);
  const drop = useRef(onDrop);
  useEffect(() => {
    resolve.current = resolveTarget;
    drop.current = onDrop;
  });

  const start = useCallback(
    (event: React.PointerEvent, payload: P) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      teardown.current?.();

      const rect = event.currentTarget.getBoundingClientRect();
      // Cached once: the tool window doesn't move while a drag is in flight
      const origin = originRef?.current?.getBoundingClientRect();
      const s: Session<P, T> = {
        payload,
        pointerId: event.pointerId,
        isTouch: event.pointerType !== "mouse",
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        originX: origin?.left ?? 0,
        originY: origin?.top ?? 0,
        x: event.clientX,
        y: event.clientY,
        armed: false,
        hold: 0,
        frame: 0,
        target: null,
        targetKey: "",
      };
      session.current = s;

      const tick = () => {
        const ghost = ghostRef.current;
        if (ghost) {
          const x = s.x - s.offsetX - s.originX;
          const y = s.y - s.offsetY - s.originY;
          ghost.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
        const under = document.elementFromPoint(s.x, s.y);
        const next = under ? resolve.current(under, s.x, s.y) : null;
        if (under) autoScroll(under, s.x, s.y);
        // Only push a state update when the target actually changes, so hovering doesn't re-render every frame
        const key = next ? JSON.stringify(next) : "";
        if (key !== s.targetKey) {
          s.targetKey = key;
          s.target = next;
          setTarget(next);
        }
        s.frame = requestAnimationFrame(tick);
      };

      const arm = () => {
        if (s.armed) return;
        s.armed = true;
        document.body.style.userSelect = "none";
        setActive({ payload: s.payload, size: { width: rect.width, height: rect.height } });
        s.frame = requestAnimationFrame(tick);
      };

      const finish = (commit: boolean) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        window.clearTimeout(s.hold);
        cancelAnimationFrame(s.frame);
        teardown.current = null;
        session.current = null;
        if (!s.armed) return;
        document.body.style.userSelect = "";
        setActive(null);
        setTarget(null);
        if (commit) drop.current(s.payload, s.target);
        // A completed mouse drag is followed by a click, which would otherwise open whatever was just dropped
        const swallow = (click: MouseEvent) => {
          click.preventDefault();
          click.stopPropagation();
        };
        window.addEventListener("click", swallow, { capture: true, once: true });
        window.setTimeout(() => window.removeEventListener("click", swallow, true), 0);
      };

      const onMove = (move: PointerEvent) => {
        if (move.pointerId !== s.pointerId) return;
        s.x = move.clientX;
        s.y = move.clientY;
        if (s.armed) {
          // Keeps the page from scrolling under an armed drag
          move.preventDefault();
          return;
        }
        const distance = Math.hypot(move.clientX - s.startX, move.clientY - s.startY);
        if (s.isTouch) {
          if (distance > TOUCH_SLOP) finish(false); // reads as a scroll, so hand the gesture back
        } else if (distance > MOUSE_THRESHOLD) {
          arm();
        }
      };

      const onUp = (up: PointerEvent) => {
        if (up.pointerId !== s.pointerId) return;
        // Touch can release a few pixels from the last move, so the release point decides the drop, not the last frame.
        if (s.armed) {
          s.x = up.clientX;
          s.y = up.clientY;
          const under = document.elementFromPoint(s.x, s.y);
          s.target = under ? resolve.current(under, s.x, s.y) : null;
        }
        finish(true);
      };

      const onCancel = (cancel: PointerEvent) => {
        if (cancel.pointerId === s.pointerId) finish(false);
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      teardown.current = () => finish(false);
      if (s.isTouch) s.hold = window.setTimeout(arm, TOUCH_HOLD_MS);
    },
    [originRef]
  );

  // Unmounting mid-drag would otherwise leave the window listeners and the userSelect lock behind
  useEffect(() => () => teardown.current?.(), []);

  return {
    payload: active?.payload ?? null,
    size: active?.size ?? null,
    target,
    ghostRef,
    start,
    cancel: useCallback(() => teardown.current?.(), []),
  };
}
