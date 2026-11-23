"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { api } from "@/lib/learning-api";
import { Button, Card, Field, Loading, Page, PageHeader, useFlash } from "@/components/ui/kit";
type Year = {id:number;name:string;start_date:string;end_date:string;is_active:boolean};
type Section = {id:number;academic_year_id:number;grade:number;section:string};
type Subject = {id:number;name:string;code:string};
type Assignment = {section_id:number;subject_id:number};
export default function SchoolStructurePage(){
 const {busy,run,flash,setError}=useFlash();
 const [ready,setReady]=useState(false);
 const [years,setYears]=useState<Year[]>([]),[sections,setSections]=useState<Section[]>([]),[subjects,setSubjects]=useState<Subject[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]);
 const [year,setYear]=useState({name:"2026-27",start_date:"2026-04-01",end_date:"2027-03-31"});
 const [section,setSection]=useState({academic_year_id:"",grade:"7",section:"A"});
 const [subject,setSubject]=useState({name:"",code:""});
 const [mapping,setMapping]=useState({section_id:"",subject_id:""});
 const load=useCallback(async()=>{const [y,s,t,a]=await Promise.all([api<Year[]>("/school/structure/years"),api<Section[]>("/school/structure/sections"),api<Subject[]>("/school/structure/subjects"),api<Assignment[]>("/school/structure/assignments")]);setYears(y);setSections(s);setSubjects(t);setAssignments(a);},[]);
 useEffect(()=>{load().catch(e=>setError(e.message)).finally(()=>setReady(true));},[load,setError]);
 const submit=(e:FormEvent,path:string,body:object,message:string)=>{e.preventDefault();void run(async()=>{await api(path,{method:"POST",body:JSON.stringify(body)});await load();},message);};
 if(!ready)return <Loading/>;
 return <Page><PageHeader title="Academic structure" subtitle="Manage school academic years, class sections and subject offerings." actions={<Link href="/school-admin">Back to school admin</Link>}/>{flash}
 <div className="sk-grid cols-2">
 <Card title="Academic years" subtitle="Activate one year at a time; existing records are retained.">
 <form className="sk-form" onSubmit={e=>submit(e,"/school/structure/years",{...year,start_date:year.start_date+"T00:00:00Z",end_date:year.end_date+"T00:00:00Z"},"Academic year created.")}>
 <Field label="Year name"><input className="sk-input" required value={year.name} onChange={e=>setYear({...year,name:e.target.value})}/></Field>
 <Field label="Start date"><input className="sk-input" type="date" required value={year.start_date} onChange={e=>setYear({...year,start_date:e.target.value})}/></Field>
 <Field label="End date"><input className="sk-input" type="date" required value={year.end_date} onChange={e=>setYear({...year,end_date:e.target.value})}/></Field>
 <Button variant="primary" disabled={busy}>Create year</Button></form>
 {years.map(y=><div className="sk-list-item" key={y.id}><span style={{flex:1}}><b>{y.name}</b> {y.is_active?"(Active)":""}</span>{!y.is_active&&<Button size="sm" disabled={busy} onClick={()=>void run(async()=>{await api(`/school/structure/years/${y.id}/activate`,{method:"PUT"});await load();},"Academic year activated.")}>Activate</Button>}</div>)}
 </Card>
 <Card title="Class & section management" subtitle="Sections are scoped to an academic year.">
 <form className="sk-form" onSubmit={e=>submit(e,"/school/structure/sections",{academic_year_id:Number(section.academic_year_id),grade:Number(section.grade),section:section.section},"Section created.")}>
 <Field label="Academic year"><select className="sk-select" required value={section.academic_year_id} onChange={e=>setSection({...section,academic_year_id:e.target.value})}><option value="">Select year</option>{years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</select></Field>
 <Field label="Class"><select className="sk-select" value={section.grade} onChange={e=>setSection({...section,grade:e.target.value})}>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>Class {i+1}</option>)}</select></Field>
 <Field label="Section"><input className="sk-input" required maxLength={20} value={section.section} onChange={e=>setSection({...section,section:e.target.value})}/></Field>
 <Button variant="primary" disabled={busy||!years.length}>Create section</Button></form>
 {sections.map(s=><div className="sk-list-item" key={s.id}>Class {s.grade} — {s.section} · {years.find(y=>y.id===s.academic_year_id)?.name}</div>)}
 </Card>
 <Card title="Subject management" subtitle="Create reusable school subjects.">
 <form className="sk-form" onSubmit={e=>submit(e,"/school/structure/subjects",subject,"Subject created.")}>
 <Field label="Subject name"><input className="sk-input" required minLength={2} value={subject.name} onChange={e=>setSubject({...subject,name:e.target.value})}/></Field>
 <Field label="Code"><input className="sk-input" required minLength={2} placeholder="HIST" value={subject.code} onChange={e=>setSubject({...subject,code:e.target.value})}/></Field>
 <Button variant="primary" disabled={busy}>Create subject</Button></form>
 {subjects.map(s=><div className="sk-list-item" key={s.id}>{s.name} ({s.code})</div>)}
 </Card>
 <Card title="Assign subjects to sections" subtitle="One subject can be offered in multiple class sections.">
 <form className="sk-form" onSubmit={e=>submit(e,"/school/structure/assignments",{section_id:Number(mapping.section_id),subject_id:Number(mapping.subject_id)},"Subject assigned.")}>
 <Field label="Class & section"><select className="sk-select" required value={mapping.section_id} onChange={e=>setMapping({...mapping,section_id:e.target.value})}><option value="">Select section</option>{sections.map(s=><option key={s.id} value={s.id}>Class {s.grade} {s.section} — {years.find(y=>y.id===s.academic_year_id)?.name}</option>)}</select></Field>
 <Field label="Subject"><select className="sk-select" required value={mapping.subject_id} onChange={e=>setMapping({...mapping,subject_id:e.target.value})}><option value="">Select subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
 <Button variant="primary" disabled={busy||!sections.length||!subjects.length}>Assign subject</Button></form>
 {assignments.map(a=><div className="sk-list-item" key={`${a.section_id}-${a.subject_id}`}><span style={{flex:1}}>{subjects.find(s=>s.id===a.subject_id)?.name} — {(()=>{const s=sections.find(x=>x.id===a.section_id);return s?`Class ${s.grade} ${s.section}`:"Unknown section";})()}</span><Button size="sm" variant="danger" disabled={busy} onClick={()=>void run(async()=>{await api(`/school/structure/assignments/${a.section_id}/${a.subject_id}`,{method:"DELETE"});await load();},"Assignment removed.")}>Remove</Button></div>)}
 </Card>
 </div></Page>;
}
