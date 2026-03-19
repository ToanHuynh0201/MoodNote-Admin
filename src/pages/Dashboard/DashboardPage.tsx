import './DashboardPage.css'

const stats = [
  { label: 'Total Users', value: '—', icon: '👥' },
  { label: 'Total Moods', value: '—', icon: '😊' },
  { label: 'Active Today', value: '—', icon: '📅' },
  { label: 'New This Week', value: '—', icon: '📈' },
]

export default function DashboardPage() {
  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2 className="dashboard__title">Dashboard</h2>
        <p className="dashboard__subtitle">Welcome back to MoodNote Admin</p>
      </div>

      <div className="dashboard__stats">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span className="stat-card__icon">{stat.icon}</span>
            <div className="stat-card__body">
              <p className="stat-card__label">{stat.label}</p>
              <p className="stat-card__value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
