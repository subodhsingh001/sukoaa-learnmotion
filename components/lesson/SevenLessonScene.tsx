"use client";
import {useRef} from "react";
import {useFrame} from "@react-three/fiber";
import * as THREE from "three";
import {HumanBody3D,Photosynthesis3D} from "./Biology3D";
export type LessonKind="solar-system"|"atomic-structure"|"human-body"|"geometry"|"photosynthesis"|"force-and-motion"|"fractions";
export type SceneProps={kind:LessonKind;value:number;level:number;playing:boolean;selected:number;onSelect:(v:number)=>void};
const colors=["#fbbf24","#60a5fa","#fb7185","#a78bfa","#34d399","#f97316","#e879f9","#22d3ee"];
function Orb({radius,size,color,speed,playing,phase,onClick}:{radius:number;size:number;color:string;speed:number;playing:boolean;phase:number;onClick?:()=>void}){
 const ref=useRef<THREE.Group>(null);
 useFrame((_,dt)=>{if(ref.current&&playing)ref.current.rotation.y+=Math.min(dt,.05)*speed});
 return <group ref={ref} rotation={[0,phase,0]}><mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[radius,.008,5,100]}/><meshBasicMaterial color="#64748b" transparent opacity={.6}/></mesh><mesh position={[radius,0,0]} onClick={onClick}><sphereGeometry args={[size,20,16]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.12}/></mesh></group>;
}
function Model({kind,value,level,playing,selected,onSelect}:SceneProps){
 const spin=useRef<THREE.Group>(null);
 useFrame((_,dt)=>{if(spin.current&&playing)spin.current.rotation.y+=Math.min(dt,.05)*.35*level});
 if(kind==="solar-system")return <group><mesh><sphereGeometry args={[.6,32,24]}/><meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={1}/></mesh>{Array.from({length:8},(_,i)=><Orb key={i} radius={1+i*.43} size={.09+i*.016} color={colors[i]} speed={(.8/(i+1))*level} playing={playing} phase={i*.8} onClick={()=>onSelect(i)}/>)}</group>;
 if(kind==="atomic-structure")return <group><mesh><sphereGeometry args={[.5,24,20]}/><meshStandardMaterial color="#f472b6"/></mesh>{Array.from({length:Math.min(12,value)},(_,i)=><Orb key={i} radius={i<2?1.35:2.25} size={.13} color="#38bdf8" speed={(i%2?-.6:.8)*level} playing={playing} phase={i*6.28/Math.min(12,value)}/>)}</group>;
 if(kind==="geometry")return <group ref={spin}><mesh onClick={()=>onSelect((selected+1)%4)}>{selected===0?<boxGeometry args={[2.6,2.6,2.6]}/>:selected===1?<sphereGeometry args={[1.6,32,24]}/>:selected===2?<cylinderGeometry args={[1.2,1.2,2.7,32]}/>:<coneGeometry args={[1.4,2.8,32]}/>}<meshStandardMaterial color="#a78bfa" wireframe={value>0} metalness={.1}/></mesh></group>;
 if(kind==="human-body")return <HumanBody3D selected={selected} onSelect={onSelect} playing={playing}/>;
 if(kind==="photosynthesis")return <Photosynthesis3D level={level} playing={playing}/>;
 if(kind==="force-and-motion")return <group><mesh position={[0,-1.5,0]}><boxGeometry args={[9,.15,3]}/><meshStandardMaterial color="#475569"/></mesh><group position={[Math.max(-3.5,Math.min(3.5,value*.06)), -0.75,0]}><mesh><boxGeometry args={[1.5,1.35,1.3]}/><meshStandardMaterial color="#60a5fa"/></mesh><mesh position={[.9,.3,0]}><coneGeometry args={[.22,.75,12]}/><meshStandardMaterial color="#f97316"/></mesh></group></group>;
 const n=Math.max(1,Math.min(12,level));const filled=Math.min(n,Math.max(0,value));
 return <group ref={spin}>{Array.from({length:n},(_,i)=>{const angle=(i/n)*Math.PI*2;return <mesh key={i} position={[Math.cos(angle)*1.4,Math.sin(angle)*1.4,0]} onClick={()=>onSelect(i+1)}><boxGeometry args={[.65,.65,.75]}/><meshStandardMaterial color={i<filled?"#a78bfa":"#475569"} emissive={i<filled?"#4c1d95":"#000000"} emissiveIntensity={.2}/></mesh>})}</group>;
}
export default Model;
