"use client";
import dynamic from "next/dynamic";
import type { Scene } from "@/lib/storyboard";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false, loading: () => <div className="sk-loading" style={{ color: "#c9d0ff" }}>Loading 3D…</div> });
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);

function NumberLine({ p }: { p: Scene["params"] }) {
  const min = num(p.min), max = num(p.max, 10), mark = num(p.mark, min);
  const x = (v: number) => 60 + ((v - min) / (max - min)) * 680;
  const step = Math.max(1, Math.ceil((max - min) / 20));
  const ticks: number[] = []; for (let v = min; v <= max; v += step) ticks.push(v);
  return (
    <svg viewBox="0 0 800 220" role="img" aria-label={`Number line from ${min} to ${max}, marker at ${mark}`}>
      <line x1={60} x2={740} y1={120} y2={120} stroke="#8fa0ff" strokeWidth={4} strokeLinecap="round" />
      {ticks.map((t) => <g key={t}><line x1={x(t)} x2={x(t)} y1={108} y2={132} stroke="#c9d0ff" strokeWidth={3} /><text className="sk-svgtext small" x={x(t)} y={162} textAnchor="middle">{t}</text></g>)}
      <g style={{ transform: `translateX(${x(mark)}px)`, animation: "sk-slide-in 2.4s ease both" }}>
        <style>{`@keyframes sk-slide-in { from { transform: translateX(${x(min)}px); } to { transform: translateX(${x(mark)}px); } }`}</style>
        <circle cx={0} cy={120} r={16} fill="#ff7aa8" /><path d="M0 92 L-9 72 L9 72 Z" fill="#ff7aa8" />
        <text className="sk-svgtext" x={0} y={54} textAnchor="middle">{mark}</text>
      </g>
      {str(p.label) && <text className="sk-svgtext small" x={400} y={205} textAnchor="middle">{str(p.label)}</text>}
    </svg>
  );
}

function ForceDiagram({ p }: { p: Scene["params"] }) {
  const f = num(p.force, 8), m = num(p.mass, 2), a = f / m;
  const w = 70 + m * 9, d = Math.min(340, 40 + a * 45);
  return (
    <svg viewBox="0 0 800 260" role="img" aria-label={`Force ${f} N on mass ${m} kg gives acceleration ${a.toFixed(1)}`}>
      <line x1={20} x2={780} y1={190} y2={190} stroke="#8fa0ff" strokeWidth={4} />
      <g style={{ ["--d" as string]: `${d}px`, animation: "sk-push 3.2s ease-in both" }}>
        <rect x={150} y={190 - w * 0.75} width={w} height={w * 0.75} rx={8} fill="#7b6cff" /><text className="sk-svgtext" x={150 + w / 2} y={190 - w * 0.3} textAnchor="middle">{m} kg</text>
        <line x1={150 - 20 - f * 9} x2={146} y1={190 - w * 0.37} y2={190 - w * 0.37} stroke="#ffcf5c" strokeWidth={8} strokeLinecap="round" />
        <path d={`M152 ${190 - w * 0.37 - 14} L170 ${190 - w * 0.37} L152 ${190 - w * 0.37 + 14}`} fill="none" stroke="#ffcf5c" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text className="sk-svgtext" x={400} y={236} textAnchor="middle">a = F ÷ m = {f} ÷ {m} = {a.toFixed(1)} m/s²</text>
    </svg>
  );
}

function Orbit({ p }: { p: Scene["params"] }) {
  return (
    <svg viewBox="0 0 800 320" role="img" aria-label={`${str(p.orbiter_label)} orbiting ${str(p.center_label)}`}>
      <ellipse cx={400} cy={160} rx={230} ry={130} fill="none" stroke="#5f6fd6" strokeWidth={2} strokeDasharray="6 8" />
      <circle cx={400} cy={160} r={34} fill="#ffcf5c" />
      <g style={{ transformOrigin: "400px 160px", animation: "sk-spin 8s linear infinite" }}><ellipse cx={400} cy={160} rx={0} ry={0} /><circle cx={630} cy={160} r={13} fill="#4fd1c5" /></g>
      <text className="sk-svgtext" x={40} y={40}>● <tspan fill="#ffcf5c">{str(p.center_label)}</tspan></text>
      <text className="sk-svgtext" x={40} y={74}>● <tspan fill="#4fd1c5">{str(p.orbiter_label)}</tspan></text>
    </svg>
  );
}

function Cycle({ p }: { p: Scene["params"] }) {
  const steps = (Array.isArray(p.steps) ? p.steps : []).map(String);
  const n = steps.length, cx = 400, cy = 170, r = 120;
  const pos = steps.map((_, i) => ({ x: cx + 1.9 * r * Math.sin((2 * Math.PI * i) / n), y: cy - r * Math.cos((2 * Math.PI * i) / n) }));
  return (
    <svg viewBox="0 0 800 340" role="img" aria-label={`Cycle: ${steps.join(", then ")}`}>
      <defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#8fa0ff" /></marker></defs>
      {pos.map((a, i) => { const b = pos[(i + 1) % n]; const k = 0.22;
        return <line key={i} x1={a.x + (b.x - a.x) * k} y1={a.y + (b.y - a.y) * k} x2={a.x + (b.x - a.x) * (1 - k)} y2={a.y + (b.y - a.y) * (1 - k)} stroke="#8fa0ff" strokeWidth={3} markerEnd="url(#arr)" />; })}
      {pos.map((a, i) => <g key={i} style={{ transformOrigin: `${a.x}px ${a.y}px`, animation: `sk-hl ${n * 1.4}s ease-in-out ${i * 1.4}s infinite` }}>
        <rect x={a.x - 78} y={a.y - 24} width={156} height={48} rx={24} fill="#5b4fe0" /><text className="sk-svgtext small" style={{ fill: "#fff" }} x={a.x} y={a.y + 6} textAnchor="middle">{steps[i].slice(0, 20)}</text></g>)}
    </svg>
  );
}

export default function SceneView({ scene, playing }: { scene: Scene; playing: boolean }) {
  const p = scene.params;
  switch (scene.template) {
    case "title_card": return <><div className="sk-big">{str(p.heading)}</div><div className="sk-sub-big">{str(p.subtitle)}</div></>;
    case "bullets": return <><h2>{str(p.heading)}</h2><ul className="sk-points">{(Array.isArray(p.points) ? p.points : []).map((x, i) => <li key={i} style={{ animationDelay: `${0.4 + i * 0.9}s` }}>{String(x)}</li>)}</ul></>;
    case "number_line": return <NumberLine p={p} />;
    case "force_diagram": return <><h2>{str(p.label)}</h2><ForceDiagram p={p} /></>;
    case "orbit": return <Orbit p={p} />;
    case "cycle": return <><h2>{str(p.heading)}</h2><Cycle p={p} /></>;
    case "formula": return <><div className="sk-big" style={{ fontFamily: "Georgia, serif" }}>{str(p.expression)}</div><div className="sk-sub-big">{str(p.caption)}</div></>;
    case "atom3d": case "shape3d": return <Scene3D scene={scene} playing={playing} />;
    default: return null;
  }
}
