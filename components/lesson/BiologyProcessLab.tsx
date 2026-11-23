"use client";
import {useState} from "react";

const anatomy=[
 {title:"Breathe in",system:"Respiratory system",action:"The diaphragm contracts and moves down. The chest expands, air enters through the nose and trachea, and the lungs inflate.",focus:"lungs"},
 {title:"Exchange gases",system:"Respiratory system",action:"In the alveoli, oxygen passes into nearby blood capillaries while carbon dioxide moves from blood into the air to be exhaled.",focus:"alveoli"},
 {title:"Pump blood",system:"Circulatory system",action:"The right side of the heart sends oxygen-poor blood to the lungs. The left side pumps oxygen-rich blood to the rest of the body.",focus:"heart"},
 {title:"Digest food",system:"Digestive system",action:"Food moves from the mouth through the oesophagus to the stomach. The small intestine absorbs most digested nutrients.",focus:"stomach"},
 {title:"Send signals",system:"Nervous system",action:"The brain and spinal cord coordinate sensory information, movement and many automatic functions.",focus:"brain"},
];
const plant=[
 {title:"Absorb water",system:"Roots and xylem",action:"Root hairs absorb water from soil. Xylem carries water and dissolved minerals upward through the stem.",focus:"roots"},
 {title:"Capture sunlight",system:"Leaves and chloroplasts",action:"Chlorophyll in chloroplasts absorbs light energy. This energy drives the reactions of photosynthesis.",focus:"leaf"},
 {title:"Take in carbon dioxide",system:"Stomata",action:"Carbon dioxide diffuses into leaves through tiny pores called stomata. Guard cells regulate their opening.",focus:"stomata"},
 {title:"Make sugars",system:"Chloroplasts",action:"Using light energy, plants convert carbon dioxide and water into sugars. Some sugars are transported or stored.",focus:"chloroplast"},
 {title:"Release oxygen",system:"Gas exchange",action:"Oxygen produced during photosynthesis diffuses out through the stomata.",focus:"oxygen"},
];
export default function BiologyProcessLab({kind,playing}:{kind:"human-body"|"photosynthesis";playing:boolean}){
 const [step,setStep]=useState(0);
 const steps=kind==="human-body"?anatomy:plant;
 const item=steps[step];
 return <section className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm" aria-label="Guided biological process laboratory">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><p className="text-xs font-bold uppercase tracking-widest text-violet-600">Guided science laboratory</p><h3 className="text-xl font-extrabold text-slate-900">{kind==="human-body"?"How your body works":"How plants make food"}</h3></div>
   <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">Step {step+1} / {steps.length}</span>
  </div>
  <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Choose a biological process">
   {steps.map((s,i)=><button type="button" role="tab" aria-selected={step===i} key={s.title} onClick={()=>setStep(i)} className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${step===i?"border-violet-600 bg-violet-600 text-white":"border-slate-200 bg-slate-50 text-slate-700 hover:bg-violet-50"}`}>{i+1}. {s.title}</button>)}
  </div>
  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
   <div className="overflow-hidden rounded-2xl bg-[#08172a] p-3">
    {kind==="human-body"?<svg viewBox="0 0 520 320" className="w-full" role="img" aria-label={`Animated educational illustration: ${item.title}`}>
     <defs><linearGradient id="bloodRed" x2="1" y2="1"><stop stopColor="#fb7185"/><stop offset="1" stopColor="#be123c"/></linearGradient></defs>
     <path d="M168 54 Q260 10 352 54 L370 275 Q260 308 150 275Z" fill="#f8c5ae" opacity=".13" stroke="#f3b8a1" strokeWidth="3"/>
     <path d="M256 28 L256 126" stroke="#b9e6ef" strokeWidth="14" strokeLinecap="round"/><path d="M256 80 L211 117 M256 80 L305 117" stroke="#b9e6ef" strokeWidth="9" strokeLinecap="round"/>
     <path d="M235 88 C174 63 153 121 169 193 Q181 236 226 220 Q243 199 242 145Z" fill="#e890a2" stroke="#ffd3dc" strokeWidth="3" opacity={step<2?1:.35}/>
     <path d="M277 88 C338 63 359 121 343 193 Q331 236 286 220 Q269 199 270 145Z" fill="#e890a2" stroke="#ffd3dc" strokeWidth="3" opacity={step<2?1:.35}/>
     <path d="M256 157 C241 138 220 164 239 189 L263 217 Q297 188 279 166 C271 154 263 154 256 157Z" fill="url(#bloodRed)" stroke="#fda4af" strokeWidth="3" opacity={step===2?1:.5}/>
     <path d="M170 235 Q260 257 350 235" fill="none" stroke="#93c5fd" strokeWidth="8" strokeLinecap="round" opacity={step===0?1:.25}>
      {playing&&step===0?<animate attributeName="d" values="M170 235 Q260 257 350 235;M170 245 Q260 290 350 245;M170 235 Q260 257 350 235" dur="3s" repeatCount="indefinite"/>:null}
     </path>
     {step===1?<g><circle cx="392" cy="126" r="58" fill="#102b46" stroke="#7dd3fc" strokeWidth="2"/>{[0,1,2,3,4].map(i=><circle key={i} cx={367+i*12} cy={110+(i%2)*17} r="9" fill="#f9a8d4" stroke="#fff" strokeWidth="1"/>)}<path d="M337 127 L300 150" stroke="#93c5fd" strokeWidth="3" strokeDasharray="6 4"/><text x="390" y="204" textAnchor="middle" fill="#e2e8f0" fontSize="13">Alveoli</text></g>:null}
     {step===2?<g><path d="M266 180 C342 180 373 110 397 95" fill="none" stroke="#fb7185" strokeWidth="7" strokeDasharray="10 7"/><path d="M397 95 C366 61 311 51 266 155" fill="none" stroke="#60a5fa" strokeWidth="7" strokeDasharray="10 7"/><text x="392" y="55" textAnchor="middle" fill="#fda4af" fontSize="13">Body circulation</text></g>:null}
     {step===3?<g><path d="M255 217 Q225 229 239 256 Q267 279 291 251 Q302 229 274 218" fill="#f5b981" stroke="#fdba74" strokeWidth="3"/><path d="M242 263 Q300 265 292 286 Q247 291 249 275" fill="none" stroke="#fed7aa" strokeWidth="8"/></g>:null}
     {step===4?<g><path d="M251 36 Q234 14 249 5 Q274 -2 282 17 Q289 40 264 52Z" fill="#e7a2b2" stroke="#fbcfe8" strokeWidth="2"/><path d="M260 52 L260 115" stroke="#f9a8d4" strokeWidth="3" strokeDasharray="5 4"/></g>:null}
     {step===0&&playing?<g><circle cx="257" cy="30" r="7" fill="#7dd3fc"><animate attributeName="cy" values="25;100;25" dur="3s" repeatCount="indefinite"/></circle><circle cx="210" cy="155" r="6" fill="#7dd3fc"><animate attributeName="r" values="5;10;5" dur="3s" repeatCount="indefinite"/></circle></g>:null}
     <text x="18" y="29" fill="#fff" fontSize="17" fontWeight="bold">{item.system}</text><text x="18" y="305" fill="#cbd5e1" fontSize="12">Simplified cross-section • not to anatomical scale</text>
    </svg>:<svg viewBox="0 0 520 320" className="w-full" role="img" aria-label={`Animated photosynthesis diagram: ${item.title}`}>
     <rect x="0" y="249" width="520" height="71" fill="#533b28"/><path d="M250 250 L250 78" stroke="#378a49" strokeWidth="15" strokeLinecap="round"/>
     {[-1,1].map((side,i)=><g key={i}><path d={`M250 ${122+i*70} Q${250+side*90} ${60+i*70} ${250+side*148} ${100+i*65} Q${250+side*96} ${170+i*65} 250 ${122+i*70}`} fill={step===1||step===2||step===3||step===4?"#3cbd6a":"#26794a"} stroke="#9be6a6" strokeWidth="3"/><path d={`M250 ${122+i*70} L${250+side*145} ${100+i*65}`} stroke="#bbf7d0" strokeWidth="2"/></g>)}
     <path d="M250 250 Q212 275 181 290 M250 250 Q285 280 329 292 M250 265 L251 307 M251 265 Q230 292 216 313" stroke="#e5c59d" strokeWidth="5" fill="none"/>
     <circle cx="67" cy="65" r="31" fill="#facc15"/>
     {step===1?<g><path d="M93 84 L205 125" stroke="#fde68a" strokeWidth="7" strokeDasharray="12 8"/><text x="25" y="116" fill="#fef08a" fontSize="16">Light energy</text></g>:null}
     {step===0?<g><path d="M167 288 Q208 267 248 235 L250 92" stroke="#7dd3fc" strokeWidth="6" strokeDasharray="12 8" fill="none"/><text x="16" y="216" fill="#bae6fd" fontSize="15">Water ↑ xylem</text></g>:null}
     {step===2?<g><path d="M474 83 L335 116" stroke="#c4b5fd" strokeWidth="6" strokeDasharray="11 7"/><text x="360" y="67" fill="#ddd6fe" fontSize="16">CO₂ enters</text></g>:null}
     {step===3?<g><circle cx="342" cy="188" r="48" fill="#14532d" stroke="#86efac" strokeWidth="3"/>{[0,1,2,3,4].map(i=><ellipse key={i} cx={315+i*12} cy={178+(i%2)*17} rx="7" ry="12" fill="#4ade80"/>)}<text x="342" y="254" textAnchor="middle" fill="#bbf7d0" fontSize="15">Chloroplast</text></g>:null}
     {step===4?<g><path d="M336 113 L473 52" stroke="#86efac" strokeWidth="6" strokeDasharray="12 8"/><text x="368" y="35" fill="#bbf7d0" fontSize="16">O₂ released</text></g>:null}
     {playing?<circle r="7" fill={step===0?"#7dd3fc":step===1?"#fde68a":step===2?"#c4b5fd":"#86efac"}><animateMotion dur="3s" repeatCount="indefinite" path={step===0?"M170 285 Q215 270 250 220 L250 95":step===1?"M93 84 L205 125":step===2?"M474 83 L335 116":"M336 113 L473 52"}/></circle>:null}
     <text x="18" y="27" fill="white" fontSize="17" fontWeight="bold">{item.system}</text><text x="18" y="309" fill="#e2e8f0" fontSize="12">Conceptual process diagram • not a chemical-rate model</text>
    </svg>}
   </div>
   <div className="flex flex-col justify-center gap-3">
    <p className="text-xs font-bold uppercase tracking-widest text-violet-600">{item.system}</p><h4 className="text-2xl font-bold text-slate-900">{item.title}</h4><p className="leading-7 text-slate-700">{item.action}</p>
    {kind==="photosynthesis"&&step===3?<p className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-900">Carbon dioxide + water + light energy → sugar + oxygen</p>:null}
    <div className="flex gap-2"><button type="button" disabled={step===0} onClick={()=>setStep(v=>Math.max(0,v-1))} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:opacity-40">Previous</button><button type="button" onClick={()=>setStep(v=>(v+1)%steps.length)} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white">{step===steps.length-1?"Start again":"Next step →"}</button></div>
   </div>
  </div>
  <p className="mt-3 text-xs text-slate-500">Scientific teaching illustration. The diagrams simplify anatomy and biological processes for classroom learning.</p>
 </section>;
}
