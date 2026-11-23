import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { skills, subjects } from "@/data/dashboard";
import WelcomeCard from "./WelcomeCard";
import SkillCard from "./SkillCard";
import SubjectCard from "./SubjectCard";
import ActivityChart from "./ActivityChart";
import DiscoveryCard from "./DiscoveryCard";

export default function Dashboard() {
  return <div className="dashboard-container">
    <div className="page-title"><span className="eyebrow">YOUR PERSONAL SPACE</span><h1>Dashboard</h1><p>Let&apos;s make today a day full of discoveries!</p></div>
    <div className="dashboard-grid">
      <div className="left-column">
        <WelcomeCard />
        <div className="skills-grid">{skills.map(skill => <SkillCard key={skill.name} skill={skill} />)}</div>
        <ActivityChart />
        <section className="quick-challenge">
          <div className="challenge-illustration">🧩</div>
          <div><span>DAILY CHALLENGE</span><h3>Ready for a brain adventure?</h3><p>Solve one fun puzzle and earn a star.</p></div>
          <Link href="/explore" aria-label="Explore challenges" className="challenge-action"><Play size={18} fill="currentColor" /></Link>
        </section>
      </div>
      <div className="right-column">
        <div className="section-heading homework-heading"><div><h3>Keep Learning</h3><p>Your learning progress</p></div><Link className="text-link" href="/explore">View all <ArrowRight size={14} /></Link></div>
        <div className="subject-list">{subjects.map(subject => <SubjectCard key={subject.id} subject={subject} />)}</div>
        <DiscoveryCard />
      </div>
    </div>
    <footer className="dashboard-footer"><span>© SUKOAA LearnMotion AI</span><span>Learn something amazing every day ✨</span></footer>
  </div>;
}
