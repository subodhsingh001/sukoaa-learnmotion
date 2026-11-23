"use client";
import {useLessonCompletion} from './useLessonCompletion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import LessonQuiz from './LessonQuiz';

type ObjectItem={id:string;name:string;mass:number;emoji:string};
const objects:ObjectItem[]=[{id:'crate',name:'Wooden crate',mass:50,emoji:'📦'},{id:'fridge',name:'Refrigerator',mass:200,emoji:'🧊'},{id:'student',name:'Student',mass:40,emoji:'🧍'},{id:'teacher',name:'Teacher',mass:80,emoji:'🧑‍🏫'},{id:'bucket',name:'Water container',mass:100,emoji:'🪣'}];
const questions=[
 {question:'When applied force is less than the maximum static friction, what happens to an object initially at rest?',options:['It remains at rest','It accelerates immediately','It moves at constant speed'],answer:0,explanation:'Static friction can balance the applied force up to its maximum value.'},
 {question:'For the same net force, doubling mass makes acceleration:',options:['Twice as large','Half as large','Unchanged'],answer:1,explanation:'Newton’s second law gives a = Fnet / m.'},
 {question:'If the object is moving right and the net force points left, what initially happens?',options:['It speeds up right','It slows down','It immediately moves left'],answer:1,explanation:'A leftward acceleration initially reduces rightward velocity.'}
];
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const fmt=(n:number)=>Math.abs(n)<.005?'0.00':n.toFixed(2);
const g=9.81;
const STEP=1/120;
const MAX_X=18;
export default function ForceMotionLab(){
 const [selected,setSelected]=useState<string[]>(['crate']);
 const [force,setForce]=useState(0);
 const [friction,setFriction]=useState(.25);
 const [running,setRunning]=useState(false);
 const [prediction,setPrediction]=useState<'left'|'right'|'still'|''>('');
 const [show,setShow]=useState({forces:true,net:true,values:true,masses:true,speed:true,acceleration:true});
 const [state,setState]=useState({x:0,v:0,t:0,a:0,net:0,frictionForce:0});
 const {message,markComplete}=useLessonCompletion('force-and-motion');
 const [fullscreen,setFullscreen]=useState(false);
 const [log,setLog]=useState<{time:number;speed:number;position:number}[]>([]);
 const stageRef=useRef<HTMLDivElement>(null);
 const physicsRef=useRef(state);const lastFrame=useRef<number|null>(null);const accumulator=useRef(0);const sampleTime=useRef(0);
 const mass=useMemo(()=>objects.filter(o=>selected.includes(o.id)).reduce((sum,o)=>sum+o.mass,0),[selected]);
 const muStatic=friction*.9,muKinetic=friction*.7;
 const compute=useCallback((v:number)=>{
   if(!mass)return {net:0,a:0,frictionForce:0};
   const staticLimit=muStatic*mass*g;
   let frictionForce:number;
   if(Math.abs(v)<.0005){frictionForce=Math.abs(force)<=staticLimit?force:Math.sign(force)*muKinetic*mass*g;}
   else frictionForce=Math.sign(v)*muKinetic*mass*g;
   const net=force-frictionForce;
   return {net,a:net/mass,frictionForce};
 },[mass,force,muStatic,muKinetic]);
 const reset=useCallback(()=>{setRunning(false);lastFrame.current=null;accumulator.current=0;sampleTime.current=0;const s={x:0,v:0,t:0,a:0,net:0,frictionForce:0};physicsRef.current=s;setState(s);setLog([]);setPrediction('');},[]);
 const updateExperiment=(fn:()=>void)=>{reset();fn()};
 const toggleObject=(id:string)=>updateExperiment(()=>setSelected(old=>old.includes(id)?old.filter(v=>v!==id):[...old,id]));
 const tick=useCallback((dt:number)=>{
   const s=physicsRef.current;let {net,a,frictionForce}=compute(s.v);
   let v=s.v+a*dt;
   if(Math.abs(s.v)>.0005&&Math.sign(s.v)!==Math.sign(v)&&Math.abs(force)<=muStatic*mass*g){v=0;({net,a,frictionForce}=compute(0));}
   if(Math.abs(v)<.0005&&Math.abs(force)<=muStatic*mass*g){v=0;net=0;a=0;frictionForce=force;}
   let x=s.x+(s.v+v)*.5*dt;
   if(x>=MAX_X){x=MAX_X;v=0;}if(x<=-MAX_X){x=-MAX_X;v=0;}
   const next={x,v,t:s.t+dt,a,net,frictionForce};physicsRef.current=next;
 },[compute,force,mass,muStatic]);
 useEffect(()=>{if(!running)return;let raf=0;const animate=(now:number)=>{
   if(lastFrame.current===null)lastFrame.current=now;
   accumulator.current+=Math.min((now-lastFrame.current)/1000,.05);lastFrame.current=now;
   let steps=0;while(accumulator.current>=STEP&&steps<8){tick(STEP);accumulator.current-=STEP;steps++;}
   const s=physicsRef.current;setState({...s});
   if(s.t-sampleTime.current>=.25){sampleTime.current=s.t;setLog(old=>[...old.slice(-59),{time:s.t,speed:s.v,position:s.x}]);}
   if(s.t>=60||Math.abs(s.x)>=MAX_X){setRunning(false);return;}
   raf=requestAnimationFrame(animate);
 };raf=requestAnimationFrame(animate);return()=>{cancelAnimationFrame(raf);lastFrame.current=null};},[running,tick]);
 useEffect(()=>{const listener=()=>setFullscreen(document.fullscreenElement===stageRef.current);document.addEventListener('fullscreenchange',listener);return()=>document.removeEventListener('fullscreenchange',listener)},[]);
 const toggleFullscreen=async()=>{if(!stageRef.current)return;try{if(document.fullscreenElement)await document.exitFullscreen();else await stageRef.current.requestFullscreen()}catch{}};
 const current=compute(state.v);const direction=current.net>0?'right':current.net<0?'left':'still';
 const cartLeft=50+(state.x/MAX_X)*43;
 const isReady=mass>0;
 const speedNeedle=clamp(state.v/18,-1,1)*105;
 const toggleDisplay=(key:keyof typeof show)=>setShow(s=>({...s,[key]:!s[key]}));
 return <section className="dashboard-container lesson-page"><Link href="/explore/force-and-motion" className="text-link">← Back to topic</Link>
 <p className="eyebrow" style={{marginTop:20}}>SUKOAA · INTERACTIVE PHYSICS LAB · MILESTONE 9</p><h1 className="lesson-heading">Forces &amp; Motion — Experiment Lab</h1>
 <p className="lesson-subtitle">Choose objects, change force and friction, predict the outcome, then test it. This is an original educational simulation inspired by real laboratory activities.</p>
 <div className="m9-layout"><div className="m9-main">
 <div className="m9-scene" ref={stageRef}>
 <div className="m9-sky"><div className="m9-cloud cloud-a"/><div className="m9-cloud cloud-b"/></div>
 <div className="m9-scene-top">
 {show.speed&&<div className="m9-gauge"><div className="m9-gauge-title">Speed</div><div className="m9-gauge-dial"><div className="m9-needle" style={{transform:`translateX(-50%) rotate(${speedNeedle}deg)`}}/></div><strong>{fmt(state.v)} m/s</strong><small>Signed velocity</small></div>}
 <div className="m9-scene-readouts">{show.acceleration&&<span>Acceleration: <b>{fmt(state.a)} m/s²</b></span>}{show.net&&<span>Net force: <b>{fmt(state.net)} N</b></span>}{show.values&&<span>Position: <b>{fmt(state.x)} m</b> · Time: <b>{state.t.toFixed(1)} s</b></span>}</div>
 <button type="button" className="m9-fullscreen" onClick={toggleFullscreen}>{fullscreen?'Exit full screen':'⛶ Full screen'}</button></div>
 <div className="m9-horizon"/><div className="m9-ground"/>
 <div className="m9-cart" style={{left:`${cartLeft}%`}}>
 {show.forces&&Math.abs(force)>0&&<div className={'m9-force-arrow '+(force<0?'left':'right')}>{force>0?'➜':'⬅'} {show.values?`${Math.abs(force)} N`:''}</div>}
 <div className="m9-stack">{selected.map(id=>{const obj=objects.find(o=>o.id===id)!;return <div className="m9-stack-item" key={id} title={`${obj.name}: ${obj.mass} kg`}>{obj.emoji}{show.masses&&<span>{obj.mass} kg</span>}</div>})}{!isReady&&<span className="m9-empty">Select an object below</span>}</div>
 <div className="m9-cart-base"><div className="m9-wheel"/><div className="m9-wheel"/></div>
 </div><div className="m9-stage-footer">Drag-and-drop style object selection below · Track is schematic; values are simulated in metres</div>
 </div>
 <div className="m9-controls"><div className="m9-control-head"><h2>Applied force</h2><strong>{force} N</strong></div>
 <div className="m9-force-buttons"><button onClick={()=>updateExperiment(()=>setForce(f=>clamp(f-25,-500,500)))} aria-label="Decrease force by 25 newtons">−25</button><button onClick={()=>updateExperiment(()=>setForce(f=>clamp(f-5,-500,500)))} aria-label="Decrease force by 5 newtons">−5</button><input aria-label="Applied force in newtons" type="number" min={-500} max={500} value={force} onChange={e=>updateExperiment(()=>setForce(clamp(Number(e.target.value)||0,-500,500)))}/><button onClick={()=>updateExperiment(()=>setForce(f=>clamp(f+5,-500,500)))} aria-label="Increase force by 5 newtons">+5</button><button onClick={()=>updateExperiment(()=>setForce(f=>clamp(f+25,-500,500)))} aria-label="Increase force by 25 newtons">+25</button></div>
 <input aria-label="Applied force slider" type="range" min={-500} max={500} step={5} value={force} onChange={e=>updateExperiment(()=>setForce(Number(e.target.value)))}/><div className="m9-range-label"><span>← −500 N</span><span>0</span><span>+500 N →</span></div>
 <div className="m9-control-head"><h2>Friction</h2><strong>{friction===0?'None':friction>=.7?'High':'Medium / Low'} ({friction.toFixed(2)})</strong></div><input aria-label="Friction slider" type="range" min={0} max={1} step={.05} value={friction} onChange={e=>updateExperiment(()=>setFriction(Number(e.target.value)))}/><div className="m9-range-label"><span>None</span><span>Lots</span></div>
 <div className="m9-actions"><button className="lesson-primary" disabled={!isReady} onClick={()=>setRunning(v=>!v)}>{running?'⏸ Pause':'▶ Play'}</button><button className="lesson-secondary" onClick={reset}>↻ Reset</button><button className="lesson-secondary" onClick={()=>updateExperiment(()=>{setForce(0);setFriction(.25);setSelected(['crate'])})}>Default setup</button></div>
 </div>
 <div className="m9-objects"><h2>Choose objects to put on the cart</h2><p>Click an object to add or remove it. Masses combine.</p><div className="m9-object-grid">{objects.map(o=><button key={o.id} type="button" aria-pressed={selected.includes(o.id)} className={'m9-object '+(selected.includes(o.id)?'chosen':'')} onClick={()=>toggleObject(o.id)}><span className="m9-object-emoji">{o.emoji}</span><b>{o.name}</b><small>{o.mass} kg</small><span>{selected.includes(o.id)?'✓ On cart':'+ Add to cart'}</span></button>)}</div><p className="m9-total">Total mass: <strong>{mass} kg</strong></p></div>
 <div className="m9-investigation"><h2>Predict, then experiment</h2><p>What direction will the cart initially accelerate from rest?</p><div className="motion-predictions">{(['left','still','right'] as const).map(p=><button key={p} type="button" className={'planet-chip '+(prediction===p?'active':'')} aria-pressed={prediction===p} onClick={()=>setPrediction(p)}>{p==='left'?'← Left':p==='right'?'Right →':'Stay still'}</button>)}</div>{prediction&&<p className="quiz-feedback">{prediction===(compute(0).net>0?'right':compute(0).net<0?'left':'still')?'✓ Good prediction!':'Not quite. Consider whether static friction can balance the applied force.'}</p>}</div>
 <LessonQuiz lessonSlug="force-and-motion" questions={questions} onComplete={(_score,_total,saved)=>markComplete(saved)}/>
 </div><aside className="m9-side"><div className="lesson-panel"><h2>Display settings</h2>{(Object.keys(show) as (keyof typeof show)[]).map(key=><label key={key} className="m9-check"><input type="checkbox" checked={show[key]} onChange={()=>toggleDisplay(key)}/>{({forces:'Force arrows',net:'Sum of forces',values:'Numeric values',masses:'Object masses',speed:'Speedometer',acceleration:'Acceleration'} as Record<string,string>)[key]}</label>)}</div>
 <div className="lesson-panel"><h2>Live physics</h2><div className="m9-stat"><span>Mass</span><strong>{mass} kg</strong></div><div className="m9-stat"><span>Applied force</span><strong>{force} N</strong></div><div className="m9-stat"><span>Friction force</span><strong>{fmt(current.frictionForce)} N</strong></div><div className="m9-stat"><span>Net force</span><strong>{fmt(state.net)} N</strong></div><div className="m9-stat"><span>Acceleration</span><strong>{fmt(state.a)} m/s²</strong></div><div className="m9-stat"><span>Velocity</span><strong>{fmt(state.v)} m/s</strong></div><div className="m9-stat"><span>Displacement</span><strong>{fmt(state.x)} m</strong></div><p className="m9-formula">F<sub>net</sub> = ma · a = F<sub>net</sub> / m</p></div>
 <div className="lesson-panel"><h2>Experiment challenges</h2><ol className="m9-challenges"><li>Set friction to zero. Try 50 N with different masses.</li><li>Increase friction until the cart will not start moving.</li><li>Apply a negative force to make the cart move left.</li><li>While the cart moves, reverse the applied force and observe its velocity.</li></ol><p className="lesson-progress">{message}</p></div>
 <div className="lesson-panel"><h2>Model notes</h2><p>This is a one-dimensional numerical simulation with constant gravity (9.81 m/s²), static friction μ<sub>s</sub> = 0.9 × friction setting and kinetic friction μ<sub>k</sub> = 0.7 × friction setting. The cart stops at the track limits. Objects are schematic, not physical-scale models.</p><p>Signed-in students can submit quizzes to the server for grading and progress tracking. Guest attempts remain on this device.</p></div>
 </aside></div></section>;
}
