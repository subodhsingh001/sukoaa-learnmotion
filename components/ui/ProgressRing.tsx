export default function ProgressRing({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (value / 100) * circumference;

  return (
    <svg viewBox="0 0 100 100" className="progress-ring">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#E9E6F6"
        strokeWidth="10"
      />

      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />

      <text
        x="50"
        y="55"
        textAnchor="middle"
        className="ring-number"
      >
        {value}%
      </text>
    </svg>
  );
}
