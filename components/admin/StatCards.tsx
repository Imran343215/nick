export type AdminStat = {
  label: string;
  value: string | number;
  icon: string;
  color?: "purple" | "blue" | "green" | "orange" | "pink" | "red";
};

export default function AdminStatCards({ stats }: { stats: AdminStat[] }) {
  return (
    <div className="admin-stats">
      {stats.map((stat) => (
        <div className="admin-stat-card" key={stat.label}>
          <div className={`admin-stat-card__icon admin-stat-card__icon--${stat.color ?? "purple"}`}>
            {stat.icon}
          </div>
          <div>
            <div className="admin-stat-card__value">{stat.value}</div>
            <div className="admin-stat-card__label">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
