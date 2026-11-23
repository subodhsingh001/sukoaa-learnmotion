"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {Canvas,useThree} from "@react-three/fiber";
import {OrbitControls} from "@react-three/drei";
import * as THREE from "three";
function CameraRig({reset,move}:{reset:number;move:{id:number;direction:string}}){
 const {camera}=useThree(); const controls=useRef<any>(null);
 useEffect(()=>{camera.position.set(5,4,7);controls.current?.target.set(0,0,0);controls.current?.update()},[reset,camera]);
 useEffect(()=>{if(!move.id||!controls.current)return;const right=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0).normalize();const up=new THREE.Vector3().setFromMatrixColumn(camera.matrix,1).normalize();const delta=(move.direction==='left'?right.clone().multiplyScalar(-.65):move.direction==='right'?right.clone().multiplyScalar(.65):move.direction==='up'?up.clone().multiplyScalar(.65):up.clone().multiplyScalar(-.65));camera.position.add(delta);controls.current.target.add(delta);controls.current.update()},[move,camera]);
 return <OrbitControls ref={controls} enablePan minDistance={2.4} maxDistance={24}/>;
}
export default function Interactive3DStage({children,label}:{children:ReactNode;label:string}){
 const ref=useRef<HTMLDivElement>(null);const [full,setFull]=useState(false);const [reset,setReset]=useState(0);const [move,setMove]=useState({id:0,direction:'up'});
 useEffect(()=>{const fn=()=>setFull(document.fullscreenElement===ref.current);document.addEventListener('fullscreenchange',fn);return()=>document.removeEventListener('fullscreenchange',fn)},[]);
 async function toggle(){try{if(document.fullscreenElement)await document.exitFullscreen();else await ref.current?.requestFullscreen()}catch{}}
 return <div className="subject-stage-wrap"><div ref={ref} className="subject-stage" aria-label={label}>
 <Canvas camera={{position:[5,4,7],fov:48}} dpr={[1,1.5]} gl={{antialias:true,powerPreference:'low-power'}}><color attach="background" args={["#0b122b"]}/><ambientLight intensity={1.25}/><directionalLight position={[5,8,6]} intensity={2.2}/><gridHelper args={[12,12,"#26395e","#192541"]} position={[0,-2.3,0]}/>{children}<CameraRig reset={reset} move={move}/></Canvas>
 <button className="subject-fullscreen" type="button" onClick={toggle}>{full?'Exit full screen':'⛶ Full screen'}</button><span className="subject-stage-hint">Drag to rotate · Scroll to zoom · Right-drag to pan</span></div>
 <div className="lesson-controls subject-camera"><button className="lesson-secondary" onClick={()=>setReset(v=>v+1)}>⌖ Center / Reset</button><span>Move:</span>{(['up','down','left','right'] as const).map(d=><button key={d} className="lesson-secondary" aria-label={'Move '+d} onClick={()=>setMove(v=>({id:v.id+1,direction:d}))}>{({up:'↑',down:'↓',left:'←',right:'→'})[d]}</button>)}</div></div>
}
