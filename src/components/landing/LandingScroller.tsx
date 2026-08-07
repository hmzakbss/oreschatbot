"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Orb = {
  className: string;
  top: string;
  left?: string;
  right?: string;
  factor: number;
};

const ORBS: Orb[] = [
  { className: "hero-orb hero-orb-a", top: "12%", left: "8%", factor: 0.18 },
  { className: "hero-orb hero-orb-b", top: "22%", right: "10%", factor: -0.22 },
  { className: "hero-orb hero-orb-c", top: "68%", left: "16%", factor: 0.3 },
  { className: "hero-orb hero-orb-d", top: "74%", right: "12%", factor: -0.16 },
];

const DOTS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: `${5 + ((i * 17) % 90)}%`,
  top: `${8 + ((i * 29) % 82)}%`,
  delay: `${(i % 9) * 0.35}s`,
  duration: `${3.2 + (i % 5) * 0.55}s`,
  size: 3 + (i % 4),
  factor: 0.08 + (i % 5) * 0.04,
}));

const LOCK_MS = 1000;

function ScrollAtmosphere({ pageIndex, pageCount }: { pageIndex: number; pageCount: number }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const y = pageIndex * window.innerHeight;
    const p = pageCount > 1 ? pageIndex / (pageCount - 1) : 0;

    layer.querySelectorAll<HTMLElement>("[data-parallax]").forEach((node) => {
      const factor = Number(node.dataset.parallax || 0.2);
      const rotate = Number(node.dataset.rotate || 0) * p;
      const centered = node.dataset.center === "true";
      const yShift = y * factor;

      node.style.transform = centered
        ? `translate3d(-50%, calc(-50% + ${yShift}px), 0) rotate(${rotate}deg)`
        : `translate3d(0, ${yShift}px, 0) rotate(${rotate}deg)`;
    });
  }, [pageIndex, pageCount]);

  return (
    <div
      ref={layerRef}
      className="hero-decor pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="hero-aurora" data-parallax="-0.08" data-rotate="48" />
      <div
        className="hero-ring hero-ring-1"
        data-parallax="0.12"
        data-rotate="160"
        data-center="true"
      />
      <div
        className="hero-ring hero-ring-2"
        data-parallax="-0.1"
        data-rotate="-110"
        data-center="true"
      />
      <div
        className="hero-ring hero-ring-3"
        data-parallax="0.16"
        data-rotate="200"
        data-center="true"
      />

      {ORBS.map((orb) => (
        <span
          key={orb.className}
          className={orb.className}
          data-parallax={orb.factor}
          style={{ top: orb.top, left: orb.left, right: orb.right }}
        />
      ))}

      {DOTS.map((dot) => (
        <span
          key={dot.id}
          className="hero-dot"
          data-parallax={dot.factor}
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            animationDelay: dot.delay,
            animationDuration: dot.duration,
          }}
        />
      ))}

      <div className="hero-beam hero-beam-a" data-parallax="0.28" />
      <div className="hero-beam hero-beam-b" data-parallax="-0.22" />
    </div>
  );
}

export function LandingScroller({ children }: { children: ReactNode }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(6);
  const lockedRef = useRef(false);
  const unlockTimerRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((next: number) => {
    setPageIndex((current) => {
      void current;
      return Math.max(0, Math.min(pageCount - 1, next));
    });
  }, [pageCount]);

  const move = useCallback(
    (dir: 1 | -1) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      window.clearTimeout(unlockTimerRef.current);

      setPageIndex((current) =>
        Math.max(0, Math.min(pageCount - 1, current + dir)),
      );

      unlockTimerRef.current = window.setTimeout(() => {
        lockedRef.current = false;
      }, LOCK_MS);
    },
    [pageCount],
  );

  // Panel sayısını ölç + body scroll'unu kilitle (tek scrollbar yok)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("landing-lock");
    body.classList.add("landing-lock");

    const measure = () => {
      const n = trackRef.current?.querySelectorAll(".landing-panel").length ?? 0;
      if (n > 0) setPageCount(n);
    };
    measure();

    return () => {
      html.classList.remove("landing-lock");
      body.classList.remove("landing-lock");
      window.clearTimeout(unlockTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      if (Math.abs(e.deltaY) < 6) return;
      e.preventDefault();
      move(e.deltaY > 0 ? 1 : -1);
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0]?.clientY ?? touchY;
      const delta = touchY - endY;
      if (Math.abs(delta) < 40) return;
      move(delta > 0 ? 1 : -1);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        move(1);
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        move(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(pageCount - 1);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [move, goTo, pageCount]);

  return (
    <div className="landing-viewport app-atmosphere relative h-[100dvh] w-full flex-1 overflow-hidden text-slate-800 selection:bg-indigo-600 selection:text-white">
      <div className="atmosphere-grid" aria-hidden />
      <ScrollAtmosphere pageIndex={pageIndex} pageCount={pageCount} />

      <div
        ref={trackRef}
        className="landing-track relative z-10"
        style={{
          transform: `translate3d(0, ${-pageIndex * 100}dvh, 0)`,
        }}
      >
        {children}
      </div>

      <div className="landing-dots" aria-hidden>
        {Array.from({ length: pageCount }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`landing-dot ${i === pageIndex ? "is-active" : ""}`}
            onClick={() => {
              if (lockedRef.current) return;
              lockedRef.current = true;
              setPageIndex(i);
              window.clearTimeout(unlockTimerRef.current);
              unlockTimerRef.current = window.setTimeout(() => {
                lockedRef.current = false;
              }, LOCK_MS);
            }}
            aria-label={`Sayfa ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
