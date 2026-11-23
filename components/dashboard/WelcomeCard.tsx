import { student } from "@/data/dashboard";

export default function WelcomeCard() {
  return (
    <section className="welcome-card">
      <div className="welcome-decoration decoration-one" />
      <div className="welcome-decoration decoration-two" />

      <div className="welcome-content">
        <span className="welcome-small">
          ✨ YOUR LEARNING JOURNEY
        </span>

        <h1>
          Hello, {student.name}! <span>👋</span>
        </h1>

        <p>
          Ready to discover something amazing today?
        </p>

        <div className="explorer-badge">
          <div className="badge-icon">🧪</div>
          <div>
            <small>YOUR CURRENT LEVEL</small>
            <strong>{student.level}</strong>
          </div>
        </div>
      </div>

      <div className="student-character">
        <div className="character-glow" />
        <span>{student.avatar}</span>
        <div className="character-caption">
          Let&apos;s explore!
        </div>
      </div>
    </section>
  );
}
