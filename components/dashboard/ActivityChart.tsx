import { activity } from "@/data/dashboard";

export default function ActivityChart() {
  const max = 100;
  const x = (index: number) => 35 + index * 76;
  const y = (value: number) => 205 - (value / max) * 165;

  const makePath = (key: "learning" | "practice") => {
    return activity
      .map((item, index) => {
        return `${index === 0 ? "M" : "L"} ${x(index)} ${y(
          item[key]
        )}`;
      })
      .join(" ");
  };

  return (
    <div className="chart-card">
      <div className="section-heading">
        <div>
          <h3>Learning Activity</h3>
          <p>Your learning journey over time</p>
        </div>

        <span className="period-label">Last 6 months</span>
      </div>

      <div className="chart-legend">
        <span><i className="legend-purple" /> Learning</span>
        <span><i className="legend-pink" /> Practice</span>
      </div>

      <div className="chart-scroll">
        <svg viewBox="0 0 470 250" className="activity-chart">
          {[0, 25, 50, 75, 100].map((value) => (
            <g key={value}>
              <line
                x1="35"
                y1={y(value)}
                x2="455"
                y2={y(value)}
                stroke="#EAE7F2"
                strokeDasharray="4 5"
              />
              <text
                x="5"
                y={y(value) + 4}
                className="chart-label"
              >
                {value}
              </text>
            </g>
          ))}

          <path
            d={makePath("learning")}
            fill="none"
            stroke="#8170E8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={makePath("practice")}
            fill="none"
            stroke="#EE83AB"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {activity.map((item, index) => (
            <text
              key={item.month}
              x={x(index)}
              y="235"
              textAnchor="middle"
              className="chart-label"
            >
              {item.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
