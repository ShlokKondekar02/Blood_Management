/**
 * Dashboard Page
 * Platform analytics and statistics
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUsers, FiHeart, FiCheckCircle, FiMessageSquare, FiActivity, FiAward, FiLayers, FiAlertCircle } from 'react-icons/fi';
import { MdBloodtype } from 'react-icons/md';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import API from '../api/axios';
import { getInitials, getAvatarColor, formatDate } from '../utils/helpers';
import '../styles/dashboard.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/dashboard/stats');
        if (data.success) setStats(data.stats);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="app-layout">
        <div className="dashboard-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader" />
        </div>
      </div>
    );
  }

  // Chart data for blood group distribution
  const bloodGroupChartData = {
    labels: stats?.bloodGroupStats?.map(b => b._id) || [],
    datasets: [{
      data: stats?.bloodGroupStats?.map(b => b.count) || [],
      backgroundColor: [
        '#DC143C', '#FF2D55', '#FF6B6B', '#FFA07A',
        '#FF4500', '#E91E63', '#C62828', '#AD1457'
      ],
      borderWidth: 0,
      hoverOffset: 8
    }]
  };

  // Chart data for top communities
  const topCommunitiesChartData = {
    labels: stats?.topCommunities?.map(c => c.name?.substring(0, 15)) || [],
    datasets: [{
      label: 'Members',
      data: stats?.topCommunities?.map(c => c.memberCount) || [],
      backgroundColor: 'rgba(220, 20, 60, 0.6)',
      borderColor: '#DC143C',
      borderWidth: 1,
      borderRadius: 6
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#a0a0b8', font: { family: 'Inter' } }
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: { ticks: { color: '#a0a0b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#a0a0b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  return (
    <div className="app-layout">
      <div className="dashboard-page">
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: '16px' }}>
          <FiArrowLeft /> Back to Chat
        </button>

        <h1 className="dashboard-title">
          <FiActivity /> <span>Analytics Dashboard</span>
        </h1>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--primary)' }}><FiUsers size={24} /></div>
            <div className="stat-value">{stats?.totalUsers || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--accent-green)' }}><FiLayers size={24} /></div>
            <div className="stat-value">{stats?.totalCommunities || 0}</div>
            <div className="stat-label">Communities</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--accent-orange)' }}><MdBloodtype size={24} /></div>
            <div className="stat-value">{stats?.totalRequests || 0}</div>
            <div className="stat-label">Blood Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--accent-blue)' }}><FiAlertCircle size={24} /></div>
            <div className="stat-value">{stats?.openRequests || 0}</div>
            <div className="stat-label">Open Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--accent-green)' }}><FiCheckCircle size={24} /></div>
            <div className="stat-value">{stats?.completedRequests || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--accent-yellow)' }}><FiAward size={24} /></div>
            <div className="stat-value">{stats?.verifiedDonors || 0}</div>
            <div className="stat-label">Verified Donors</div>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Blood Group Distribution</h3>
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stats?.bloodGroupStats?.length > 0 ? (
                <Doughnut data={bloodGroupChartData} options={chartOptions} />
              ) : (
                <p className="text-muted">No data available</p>
              )}
            </div>
          </div>
          <div className="chart-card">
            <h3>Top Communities</h3>
            <div style={{ height: '260px' }}>
              {stats?.topCommunities?.length > 0 ? (
                <Bar data={topCommunitiesChartData} options={barOptions} />
              ) : (
                <p className="text-muted">No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-section">
          <div className="recent-card">
            <h3><MdBloodtype /> Recent Blood Requests</h3>
            <div className="recent-list">
              {stats?.recentRequests?.length > 0 ? (
                stats.recentRequests.map(req => (
                  <div key={req._id} className="recent-item">
                    <div className="avatar avatar-sm" style={{ background: getAvatarColor(req.requester?.name) }}>
                      {getInitials(req.requester?.name)}
                    </div>
                    <div className="recent-item-info">
                      <h5>{req.requester?.name} needs {req.bloodGroup}</h5>
                      <p>{req.location} · {formatDate(req.createdAt)}</p>
                    </div>
                    <span className={`badge badge-${req.urgency}`}>{req.urgency}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted" style={{ fontSize: 'var(--font-sm)' }}>No recent requests</p>
              )}
            </div>
          </div>
          <div className="recent-card">
            <h3><FiMessageSquare /> Platform Summary</h3>
            <div className="recent-list">
              <div className="recent-item">
                <div className="certificate-icon"><FiMessageSquare /></div>
                <div className="recent-item-info">
                  <h5>{stats?.totalMessages || 0} Messages</h5>
                  <p>Total messages sent across all communities</p>
                </div>
              </div>
              <div className="recent-item">
                <div className="certificate-icon"><FiAward /></div>
                <div className="recent-item-info">
                  <h5>{stats?.totalCertificates || 0} Certificates</h5>
                  <p>Donation certificates uploaded</p>
                </div>
              </div>
              <div className="recent-item">
                <div className="certificate-icon"><FiHeart /></div>
                <div className="recent-item-info">
                  <h5>{stats?.acceptedRequests || 0} Accepted</h5>
                  <p>Requests accepted by donors</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
