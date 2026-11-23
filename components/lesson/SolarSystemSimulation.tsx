"use client";
import {useLessonCompletion} from './useLessonCompletion';
import { useState } from "react";
import dynamic from "next/dynamic";

const SolarSystemScene = dynamic(() => import("./solar3d/SolarSystemScene"), { ssr: false, loading: () => <div className="solar3d-loading">Loading 3D scene…</div> });
import { Pause, Play, RotateCcw } from "lucide-react";
import { planets, solarQuiz } from "@/data/solar-system";
import LessonPlayer from "./LessonPlayer";
import LessonQuiz from "./LessonQuiz";

export default function SolarSystemSimulation() {
 const [playing, setPlaying] = useState(true);
 const [view, setView] = useState<"3d" | "2d">("2d");
 const [speed, setSpeed] = useState(1);
 const [selected, setSelected] = useState("earth");
 const [resetKey, setResetKey] = useState(0);
 const [focusVersion, setFocusVersion] = useState(0);
 const [viewResetVersion, setViewResetVersion] = useState(0);
 const [moveVersion, setMoveVersion] = useState(0);
 const [moveDirection, setMoveDirection] = useState("up");
 function move(direction: string) { setMoveDirection(direction); setMoveVersion(v => v + 1); }
 const {message,markComplete}=useLessonCompletion('solar-system');
 const planet = planets.find(p => p.id === selected) ?? planets[2];

 return <LessonPlayer title="Explore the Solar System ☀️" subtitle="Select a planet, control the animation, then test your knowledge.">
   <div className="lesson-layout">
     <div className="lesson-main">
       <div className="view-switch" role="group" aria-label="Simulation view"><button type="button" className={view === "3d" ? "active" : ""} aria-pressed={view === "3d"} onClick={() => setView("3d")}>3D interactive</button><button type="button" className={view === "2d" ? "active" : ""} aria-pressed={view === "2d"} onClick={() => setView("2d")}>2D lightweight</button></div>
       {view === "3d" ? <SolarSystemScene selected={selected} onSelect={setSelected} playing={playing} speed={speed} resetVersion={resetKey} focusVersion={focusVersion} viewResetVersion={viewResetVersion} moveVersion={moveVersion} moveDirection={moveDirection} /> : <div className="space-stage" aria-label="Animated illustration of the Solar System, not to scale">
         <div className="space-stars" aria-hidden="true" />
         <div className="solar-scene" key={resetKey} style={{ animationPlayState: playing ? "running" : "paused" }}>
           <div className="solar-sun" title="Sun" aria-label="Sun" />
           {planets.map((p, i) => <div key={p.id} className="solar-orbit" style={{ width: `${p.orbit}%`, aspectRatio: "1", zIndex: 10 + i }}>
             <div className="solar-rotator" style={{ animationDuration: `${p.period / speed}s`, animationPlayState: playing ? "running" : "paused" }}>
               <button type="button" className={`solar-planet ${selected === p.id ? "solar-selected" : ""}`} onClick={() => setSelected(p.id)} aria-label={`Select ${p.name}`} title={p.name} style={{ width: p.size, height: p.size, background: p.color }} />
             </div>
           </div>)}
         </div>
         <span className="space-disclaimer">Illustrative orbits · sizes, distances and speeds not to scale</span>
       </div>}
       <div className="lesson-controls">
         <button type="button" className="lesson-primary" onClick={() => setPlaying(v => !v)}>{playing ? <Pause size={16}/> : <Play size={16}/>} {playing ? "Pause" : "Play"}</button>
         <label className="speed-label">Speed <select value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label>
         <button type="button" className="lesson-secondary" onClick={() => setResetKey(v => v + 1)}><RotateCcw size={16}/> Reset orbits</button>
       </div>
       {view === "3d" && <div className="lesson-controls view-position-controls" aria-label="3D camera positioning controls">
         <button type="button" className="lesson-secondary" onClick={() => setViewResetVersion(v => v + 1)}>⌖ Center / Reset view</button>
         <button type="button" className="lesson-secondary" onClick={() => setFocusVersion(v => v + 1)}>Focus selected planet</button>
         <span className="view-position-label">Move scene:</span>
         {(["up", "down", "left", "right"] as const).map(direction => <button key={direction} type="button" className="lesson-secondary view-direction" aria-label={`Move view ${direction}`} onClick={() => move(direction)}>{({up:"↑",down:"↓",left:"←",right:"→"})[direction]}</button>)}
       </div>}
       <div className="planet-picker" aria-label="Choose a planet">{planets.map(p => <button type="button" key={p.id} className={`planet-chip ${selected === p.id ? "active" : ""}`} onClick={() => setSelected(p.id)}>{p.name}</button>)}</div>
       <LessonQuiz lessonSlug="solar-system" questions={solarQuiz} onComplete={(_score,_total,saved)=>markComplete(saved)}/>
     </div>
     <aside className="lesson-side"><div className="lesson-panel"><p className="eyebrow">SELECTED PLANET</p><h2>{planet.name}</h2><div className="planet-preview" style={{ background: planet.color }} /><p>{planet.description}</p><div className="planet-fact"><strong>Did you know?</strong><p>{planet.fact}</p></div></div>
       <div className="lesson-panel"><h3>Learning goals</h3><p>Identify the eight planets, compare their characteristics and explain why they orbit the Sun.</p><p className="lesson-progress">{message}</p></div>
     </aside>
   </div>
 </LessonPlayer>;
}
