"use client";
import { useState } from "react";
import Link from "next/link";
import LessonQuiz from "./LessonQuiz";
import { useLessonCompletion } from "./useLessonCompletion";
import { humanBodyQuiz, photosynthesisQuiz } from "@/data/new-lessons";

type Organ = { name:string; system:string; purpose:string; fact:string; x:number; y:number; color:string };
const organs:Organ[] = [
 {name:"Brain",system:"Nervous",purpose:"Coordinates movement, senses, memory and decisions.",fact:"The brain communicates through networks of nerve cells.",x:50,y:13,color:"#c084fc"},
 {name:"Lungs",system:"Respiratory",purpose:"Exchange oxygen and carbon dioxide during breathing.",fact:"Tiny air sacs called alveoli provide a large exchange surface.",x:41,y:34,color:"#38bdf8"},
 {name:"Heart",system:"Circulatory",purpose:"Pumps blood to deliver oxygen and nutrients.",fact:"The heart has four chambers.",x:55,y:39,color:"#fb7185"},
 {name:"Stomach",system:"Digestive",purpose:"Mixes food with digestive juices to begin breaking it down.",fact:"The stomach is only one part of the digestive system.",x:55,y:55,color:"#f59e0b"},
 {name:"Intestines",system:"Digestive",purpose:"Absorb nutrients and water from digested food.",fact:"Most nutrient absorption happens in the small intestine.",x:49,y:68,color:"#34d399"},
];
const levels=["Low","Medium","High"] as const;
type Level=typeof levels[number];
const levelValue:Record<Level,number>={Low:1,Medium:2,High:3};
export default function BiologyLessons({kind}:{kind:"human-body"|"photosynthesis"}){
 const human=kind==="human-body";
 const [organ,setOrgan]=useState(0);
 const [system,setSystem]=useState("All");
 const [light,setLight]=useState<Level>("Medium");
 const [water,setWater]=useState<Level>("Medium");
 const [co2,setCo2]=useState<Level>("Medium");
 const [showLabels,setShowLabels]=useState(true);
 const {message,markComplete}=useLessonCompletion(kind);
 const rate=Math.min(levelValue[light],levelValue[water],levelValue[co2]);
 const limiting=([['Light',light],['Water',water],['Carbon dioxide',co2]] as const).filter(([,value])=>levelValue[value]===rate).map(([name])=>name);
 return <section className="dashboard-container lesson-page">
  <Link href={'/explore/'+kind} className="text-link">← Back to topic</Link>
  <p className="eyebrow" style={{marginTop:20}}>SUKOAA INTERACTIVE LESSON · BIOLOGY</p>
  <h1 className="lesson-heading">{human?'Explore the Human Body 🫀':'Explore Photosynthesis 🌱'}</h1>
  <p className="lesson-subtitle">{human?'Select an organ to discover how body systems work together.':'Change sunlight, water and carbon dioxide to see how the limiting input affects photosynthesis.'}</p>
  <div className="lesson-layout"><div className="lesson-main">
   {human?<div className="lesson-panel" style={{background:'linear-gradient(150deg,#eff6ff,#f0fdf4)',minHeight:460}}>
    <div className="lesson-controls"><label htmlFor="body-system">Body system</label><select id="body-system" value={system} onChange={e=>setSystem(e.target.value)} style={{padding:10,borderRadius:12,border:'1px solid #cbd5e1'}}>{['All','Nervous','Respiratory','Circulatory','Digestive'].map(s=><option key={s}>{s}</option>)}</select><button type="button" className="lesson-secondary" aria-pressed={showLabels} onClick={()=>setShowLabels(v=>!v)}>{showLabels?'Hide labels':'Show labels'}</button></div>
    <svg viewBox="0 0 300 420" role="img" aria-label="Stylized human body with selectable organ markers" style={{width:'100%',maxWidth:390,height:390,display:'block',margin:'auto'}}>
     <circle cx="150" cy="47" r="33" fill="#cbd5e1" stroke="#64748b" strokeWidth="2"/>
     <path d="M122 82 Q96 90 92 116 L68 245 L89 251 L115 153 L119 260 L116 394 L143 394 L150 270 L157 394 L184 394 L181 260 L185 153 L211 251 L232 245 L208 116 Q204 90 178 82 Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="2"/>
     {organs.filter(o=>system==='All'||o.system===system).map(o=><g key={o.name} onClick={()=>setOrgan(organs.indexOf(o))} style={{cursor:'pointer'}} role="button" tabIndex={0} aria-label={'Select '+o.name}>
      <circle cx={o.x*3} cy={o.y*4.2} r={organ===organs.indexOf(o)?19:15} fill={o.color} stroke={organ===organs.indexOf(o)?'#0f172a':'white'} strokeWidth="3"/>
      <text x={o.x*3} y={o.y*4.2+5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#0f172a">{organs.indexOf(o)+1}</text>
      {showLabels&&<text x={o.x*3+22} y={o.y*4.2+4} fontSize="11" fontWeight="bold" fill="#334155">{o.name}</text>}
     </g>)}
    </svg>
    <div className="lesson-controls" aria-label="Select an organ">{organs.filter(o=>system==='All'||o.system===system).map(o=><button key={o.name} className={'planet-chip '+(organ===organs.indexOf(o)?'active':'')} onClick={()=>setOrgan(organs.indexOf(o))}>{o.name}</button>)}</div>
   </div>:<div className="lesson-panel" style={{background:'linear-gradient(160deg,#ecfdf5,#eff6ff)'}}>
    <svg viewBox="0 0 520 330" role="img" aria-label="Diagram of a plant receiving sunlight, water and carbon dioxide and releasing oxygen" style={{width:'100%',maxHeight:350}}>
     <circle cx="75" cy="70" r={25+rate*5} fill="#facc15" opacity={0.5+rate*.15}/><text x="30" y="132" fill="#854d0e" fontSize="17">☀ Light</text>
     <rect x="0" y="270" width="520" height="60" rx="15" fill="#a7f3d0"/><path d="M260 270 Q260 160 260 105" stroke="#15803d" strokeWidth="12" fill="none"/>
     <ellipse cx="209" cy="160" rx="64" ry="26" fill="#22c55e" transform="rotate(28 209 160)"/><ellipse cx="311" cy="190" rx="66" ry="26" fill="#16a34a" transform="rotate(-28 311 190)"/><ellipse cx="259" cy="107" rx="40" ry="27" fill="#4ade80"/>
     <path d="M180 292 Q220 272 260 274 Q300 272 340 292" fill="none" stroke="#92400e" strokeWidth="8"/>
     <text x="20" y="230" fontSize="16" fill="#0369a1">💧 Water → roots</text><text x="340" y="115" fontSize="16" fill="#166534">CO₂ → leaves</text><text x="350" y="225" fontSize="16" fill="#166534">O₂ ↑ released</text>
     <text x="260" y="25" textAnchor="middle" fontWeight="bold" fontSize="18" fill="#14532d">Photosynthesis activity: {['','Low','Medium','High'][rate]}</text>
    </svg>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:15}}>{([['Sunlight',light,setLight],['Water',water,setWater],['Carbon dioxide',co2,setCo2]] as const).map(([label,value,set])=><label key={label} style={{display:'grid',gap:7,fontWeight:600}}>{label}<select value={value} onChange={e=>set(e.target.value as Level)} style={{padding:12,border:'1px solid #cbd5e1',borderRadius:12}}>{levels.map(l=><option key={l}>{l}</option>)}</select></label>)}</div>
    <div className="planet-fact" style={{marginTop:18}}><strong>Estimated rate: {['','Low','Medium','High'][rate]}</strong><p>Limiting input: {limiting.join(', ')}. Increasing an input that is not limiting may not increase the rate.</p></div>
    <button className="lesson-secondary" style={{marginTop:12}} onClick={()=>{setLight('Medium');setWater('Medium');setCo2('Medium')}}>Reset experiment</button>
   </div>}
   <LessonQuiz key={kind} lessonSlug={kind} questions={human?humanBodyQuiz:photosynthesisQuiz} onComplete={(_score,_total,saved)=>markComplete(saved)}/>
  </div><aside className="lesson-side"><div className="lesson-panel"><p className="eyebrow">{human?'SELECTED ORGAN':'HOW IT WORKS'}</p><h2>{human?organs[organ].name:'Photosynthesis'}</h2>{human?<><p><strong>System:</strong> {organs[organ].system}</p><p>{organs[organ].purpose}</p><div className="planet-fact">{organs[organ].fact}</div><p style={{fontSize:12,marginTop:12}}>Simplified diagram; not to anatomical scale.</p></>:<><p>Plants use light energy to convert water and carbon dioxide into sugars, releasing oxygen.</p><p>The experiment illustrates the <strong>limiting-factor principle</strong>, not an exact biological rate or chemical yield.</p><p>Try setting one input to Low and the others to High.</p></>}</div><div className="lesson-panel"><h3>Learning goals</h3><p>{human?'Identify major organs and explain their roles in body systems.':'Identify the inputs and outputs of photosynthesis and investigate limiting factors.'}</p><p className="lesson-progress" aria-live="polite">{message}</p></div></aside></div>
 </section>;
}
