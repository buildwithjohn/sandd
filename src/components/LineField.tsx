"use client";
import { useMemo } from "react";

// A field of drifting contour lines — the signature kinetic motion.
// Wrap in a parent with `.line-drift` / `.line-drift2` + `overflow-hidden` to animate.
function wavePath(baseline: number, amp: number, phase: number) {
  const W = 1800, step = 12, period = 300;
  let d = `M 0 ${(baseline + amp * Math.sin(phase)).toFixed(1)}`;
  for (let x = step; x <= W; x += step) {
    const y = baseline + amp * Math.sin((x / period) * Math.PI * 2 + phase);
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return d;
}

export default function LineField({ stroke = "#ffffff", count = 30 }: { stroke?: string; count?: number }) {
  const lines = useMemo(() => Array.from({ length: count }, (_, i) => ({
    d: wavePath(40 + i * 28, 26 + (i % 5) * 7, i * 0.5),
    o: 0.08 + (i % 6) * 0.03,
  })), [count]);
  return (
    <svg className="absolute inset-0 w-[150%] h-full" viewBox="0 0 1800 900" preserveAspectRatio="none" fill="none">
      {lines.map((l, i) => <path key={i} d={l.d} stroke={stroke} strokeWidth={1.4} opacity={l.o} />)}
    </svg>
  );
}
