import { Star } from "lucide-react";
import { skills } from "@/data/dashboard";

export default function SkillCard({
  skill,
}: {
  skill: (typeof skills)[number];
}) {
  return (
    <div className="skill-card">
      <div
        className="skill-icon"
        style={{ backgroundColor: skill.color }}
      >
        {skill.icon}
      </div>

      <div className="stars">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            size={13}
            fill={index < skill.rating ? "#F5D45B" : "#E6E3EE"}
            color="transparent"
          />
        ))}
      </div>

      <strong>{skill.name}</strong>
      <span>{skill.rating}/5 stars</span>
    </div>
  );
}
