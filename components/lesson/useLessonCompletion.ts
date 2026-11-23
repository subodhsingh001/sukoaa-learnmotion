"use client";
import {useCallback,useEffect,useState} from 'react';
import {getMyLessonProgress,getToken} from '@/lib/learning-api';
export type CompletionState='loading'|'not-started'|'local'|'saved'|'error';
export function useLessonCompletion(slug:string){
 const [status,setStatus]=useState<CompletionState>('loading');
 const [message,setMessage]=useState('Checking lesson progress…');
 useEffect(()=>{
  let alive=true;
  const local=()=>{try{return localStorage.getItem('sukoaa:'+slug+':complete')==='true'}catch{return false}};
  if(!getToken()){setStatus(local()?'local':'not-started');setMessage(local()?'Completed on this device. Sign in as a student to save progress.':'Complete the quiz to record progress.');return;}
  getMyLessonProgress().then(rows=>{if(!alive)return;const record=rows.find(row=>row.lesson_slug===slug&&row.completed);if(record){setStatus('saved');setMessage('✓ Lesson completed and saved to your student account.')}else{setStatus(local()?'local':'not-started');setMessage(local()?'Completed on this device; not yet confirmed in your student account.':'Complete the quiz to save progress.')}}).catch(e=>{if(!alive)return;setStatus(local()?'local':'error');setMessage('Could not load server progress: '+(e instanceof Error?e.message:'Unknown error'))});
  return()=>{alive=false};
 },[slug]);
 const markComplete=useCallback((saved:boolean)=>{try{localStorage.setItem('sukoaa:'+slug+':complete','true')}catch{}setStatus(saved?'saved':'local');setMessage(saved?'✓ Quiz completed and saved to your student account.':'✓ Quiz completed on this device. Sign in as a student to save it to your account.');},[slug]);
 return {status,message,markComplete};
}
