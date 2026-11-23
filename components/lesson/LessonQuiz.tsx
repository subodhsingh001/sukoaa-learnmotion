"use client";
import { useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { getToken, submitQuiz } from '@/lib/learning-api';
type Question = { question: string; options: string[]; answer: number; explanation: string };
export default function LessonQuiz({ questions, onComplete, lessonSlug }: { questions: Question[]; onComplete: (score: number, total: number, saved: boolean) => void; lessonSlug?:string }) {
 const [index,setIndex]=useState(0),[selected,setSelected]=useState<number|null>(null),[score,setScore]=useState(0);
 const [answers,setAnswers]=useState<number[]>([]),[finished,setFinished]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [serverSaved,setServerSaved]=useState(false);
 const current=questions[index];
 async function next(){
  if(selected===null||busy)return;
  const nextAnswers=[...answers,selected]; const nextScore=score+Number(selected===current.answer);
  if(index<questions.length-1){setAnswers(nextAnswers);setScore(nextScore);setIndex(index+1);setSelected(null);return;}
  if(lessonSlug&&getToken()){
   setBusy(true);setError('');
   try {const result=await submitQuiz(lessonSlug,nextAnswers);setScore(result.score);setServerSaved(true);setFinished(true);onComplete(result.score,result.total,true);}
   catch(e){setError(e instanceof Error?e.message:'Could not save quiz');}
   finally{setBusy(false);}
  } else {setScore(nextScore);setServerSaved(false);setFinished(true);onComplete(nextScore,questions.length,false);}
 }
 function retry(){setIndex(0);setSelected(null);setScore(0);setAnswers([]);setFinished(false);setServerSaved(false);setError('');}
 return <section className="lesson-panel quiz-panel" aria-label="Lesson quiz">
  <div className="section-heading"><h3>Knowledge Check</h3><span className="period-label">{finished?'Complete':`${index+1} / ${questions.length}`}</span></div>
  {finished?<div className="quiz-result"><CheckCircle2 size={34} color="#56C9BE"/><h3>You scored {score} / {questions.length}!</h3><p>{serverSaved?'Your attempt was graded and saved to your student account.':'Completed on this device only. Sign in as a student to save your quiz result.'}</p><button className="lesson-primary" onClick={retry}><RotateCcw size={16}/> Try again</button></div>
  :<><h4 className="quiz-question">{current.question}</h4><div className="quiz-options">{current.options.map((option,i)=><button key={option} type="button" onClick={()=>setSelected(i)} disabled={selected!==null||busy} className={`quiz-option ${selected!==null&&i===current.answer?'correct':''} ${selected===i&&i!==current.answer?'incorrect':''}`}>{option}</button>)}</div>
  {selected!==null&&<p className="quiz-feedback">{selected===current.answer?'Correct! ':'Not quite. '}{current.explanation}</p>}
  {error&&<p role="alert" style={{color:'#b91c1c'}}>{error}. Try again.</p>}
  <button type="button" className="lesson-primary" disabled={selected===null||busy} onClick={next}>{busy?'Saving...':index===questions.length-1?'Finish quiz':'Next question'}</button></>}
 </section>;
}
