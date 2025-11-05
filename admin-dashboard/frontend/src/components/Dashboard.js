import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { FiPhone, FiClock, FiTrendingUp, FiActivity } from 'react-icons/fi';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <FiPhone className="stat-icon" />
          <div className="stat-content">
            <h3>Total Calls</h3>
            <p>{stats?.totalCalls || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <FiActivity className="stat-icon" />
          <div className="stat-content">
            <h3>Calls Today</h3>
            <p>{stats?.callsToday || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <FiClock className="stat-icon" />
          <div className="stat-content">
            <h3>Avg Duration</h3>
            <p>{stats?.avgDuration || 0}s</p>
          </div>
        </div>

        <div className="stat-card">
          <FiTrendingUp className="stat-icon" />
          <div className="stat-content">
            <h3>Status</h3>
            <p>Active</p>
          </div>
        </div>
      </div>

      <div className="detail-card">
        <h2>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <a href="/transcripts" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ width: '100%' }}>
              View Transcripts
            </button>
          </a>
          <a href="/prompts" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ width: '100%' }}>
              Manage Prompts
            </button>
          </a>
          <a href="/greetings" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary" style={{ width: '100%' }}>
              Manage Greetings
            </button>
          </a>
        </div>
      </div>

      {stats?.callsByStatus && stats.callsByStatus.length > 0 && (
        <div className="detail-card" style={{ marginTop: '2rem' }}>
          <h2>Calls by Status</h2>
          <div style={{ marginTop: '1rem' }}>
            {stats.callsByStatus.map((item) => (
              <div 
                key={item.status} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem 0',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                  {item.status}
                </span>
                <span style={{ color: '#667eea', fontWeight: 'bold' }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

