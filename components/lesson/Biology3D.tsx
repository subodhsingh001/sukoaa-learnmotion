"use client";
import {useRef} from "react";
import {useFrame} from "@react-three/fiber";
import * as THREE from "three";
function Part({position,scale,color,selected,onClick,rotation,opacity=1}:{position:[number,number,number];scale:[number,number,number];color:string;selected?:boolean;onClick?:()=>void;rotation?:[number,number,number];opacity?:number}){return <mesh position={position} rotation={rotation} onClick={onClick} scale={scale}><sphereGeometry args={[1,28,20]}/><meshStandardMaterial color={color} transparent={opacity<1} opacity={opacity} roughness={.66} emissive={selected?'#fbbf24':'#000000'} emissiveIntensity={selected?.25:0}/></mesh>}
function Tube({a,b,r,color}:{a:[number,number,number];b:[number,number,number];r:number;color:string}){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from);return <mesh position={from.clone().add(to).multiplyScalar(.5).toArray()} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize())}><cylinderGeometry args={[r,r,delta.length(),12]}/><meshStandardMaterial color={color} roughness={.85}/></mesh>}
export function HumanBody3D({selected,onSelect,playing}:{selected:number;onSelect:(n:number)=>void;playing:boolean}){
 const heart=useRef<THREE.Group>(null);const lungs=useRef<THREE.Group>(null);useFrame(({clock})=>{if(heart.current)heart.current.scale.setScalar(playing?1+Math.sin(clock.elapsedTime*7)*.09:1);if(lungs.current)lungs.current.scale.set(playing?1+Math.sin(clock.elapsedTime*1.8)*.07:1,playing?1+Math.sin(clock.elapsedTime*1.8)*.05:1,1)});
 return <group position={[0,-.05,0]}><Part position={[0,1.77,0]} scale={[.43,.54,.38]} color="#e9b6a1" opacity={.94}/><Part position={[0,1.82,.27]} scale={[.37,.37,.23]} color="#e9a4ad" selected={selected===2} onClick={()=>onSelect(2)} opacity={.92}/>
 <Part position={[0,.43,0]} scale={[.86,1.08,.44]} color="#e8b5a1" opacity={.24}/><Part position={[0,-.61,0]} scale={[.62,.42,.4]} color="#d99e8b" opacity={.26}/>
 {[-1,1].map(s=><group key={s}><Tube a={[s*.75,1.05,0]} b={[s*1.1,.18,0]} r={.18} color="#dfab99"/><Tube a={[s*1.1,.18,0]} b={[s*1.13,-.45,.03]} r={.14} color="#dfab99"/><Tube a={[s*.34,-.9,0]} b={[s*.42,-1.62,0]} r={.24} color="#d9a58f"/><Tube a={[s*.42,-1.62,0]} b={[s*.44,-2.2,.1]} r={.17} color="#d9a58f"/></group>)}
 <Tube a={[0,1.3,.08]} b={[0,.55,.15]} r={.12} color="#9bd6e0"/>
 <group ref={lungs}><Part position={[-.33,.57,.24]} scale={[.36,.63,.28]} color="#c96e84" selected={selected===0} onClick={()=>onSelect(0)}/><Part position={[.33,.57,.24]} scale={[.36,.63,.28]} color="#c96e84" selected={selected===0} onClick={()=>onSelect(0)}/></group>
 <group ref={heart}><Part position={[.12,.5,.55]} scale={[.22,.28,.19]} color="#be294c" selected={selected===1} onClick={()=>onSelect(1)} rotation={[0,0,-.25]}/></group>
 <Part position={[.22,-.19,.32]} scale={[.33,.28,.24]} color="#b97776" selected={selected===3} onClick={()=>onSelect(3)}/>
 <Part position={[0,-.66,.3]} scale={[.43,.36,.25]} color="#d79a7c" selected={selected===4} onClick={()=>onSelect(4)}/>
 {[-.2,0,.2].map((x,i)=><Tube key={i} a={[x,-.53,.53]} b={[x+.12,-.81,.52]} r={.07} color="#f2b998"/>)}
 </group>
}
function Leaf({position,rotation,scale=1}:{position:[number,number,number];rotation:[number,number,number];scale?:number}){return <group position={position} rotation={rotation} scale={scale}><Part position={[-.55,0,0]} scale={[.68,.19,.37]} color="#238b45"/><Tube a={[0,0,0]} b={[-1.04,0,0]} r={.018} color="#a3d977"/></group>}
export function Photosynthesis3D({level,playing}:{level:number;playing:boolean}){const leaves=useRef<THREE.Group>(null);useFrame(({clock})=>{if(leaves.current&&playing)leaves.current.rotation.z=Math.sin(clock.elapsedTime*.8)*.035});return <group><mesh position={[0,-1.85,0]}><cylinderGeometry args={[1.08,1,.65,32]}/><meshStandardMaterial color="#9c613c" roughness={.9}/></mesh><mesh position={[0,-1.52,0]}><cylinderGeometry args={[1.03,1.03,.07,32]}/><meshStandardMaterial color="#4c3424"/></mesh>
 <Tube a={[0,-1.5,0]} b={[0,1.75,0]} r={.085} color="#398b44"/>
 <group ref={leaves}>{Array.from({length:8},(_,i)=>{const side=i%2?-1:1;const y=-1.15+i*.39;return <group key={i}><Tube a={[0,y,0]} b={[side*.45,y+.14,0]} r={.035} color="#3b8f47"/><Leaf position={[side*.45,y+.14,0]} rotation={[0,side?i*.15:0,side===1?-.35:Math.PI+.35]} scale={.72+i*.035}/></group>})}</group>
 <Part position={[0,1.73,0]} scale={[.34,.39,.33]} color="#4cae58"/>
 <mesh position={[-2.6,2.4,-1]}><sphereGeometry args={[.45,24,16]}/><meshBasicMaterial color="#fcd34d"/></mesh>
 {Array.from({length:Math.max(3,level*5)},(_,i)=>{const a=i*2.399;return <Part key={i} position={[-2+Math.cos(a)*.55,1.3+Math.sin(a)*.55,-.6]} scale={[.045,.045,.045]} color="#fef08a"/>})}
 {Array.from({length:level*4},(_,i)=><Part key={i} position={[Math.sin(i*1.7)*.5,-1.2+i*.23,.16]} scale={[.055,.075,.055]} color="#60c5ef"/>)}
 {Array.from({length:level*3},(_,i)=><Part key={i} position={[1.6+(i%3)*.16,.5+i*.26,.2]} scale={[.07,.07,.07]} color="#a7f3d0"/>)}
 </group>}
