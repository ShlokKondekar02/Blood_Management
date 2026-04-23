/**
 * Sidebar Component
 * Left panel showing user's communities and explore tab
 */

import { useState } from 'react';
import { FiSearch, FiPlus, FiUsers, FiCompass, FiUser, FiBarChart2, FiMap, FiLogOut } from 'react-icons/fi';
import { MdBloodtype } from 'react-icons/md';
import useAuth from '../../hooks/useAuth';
import CreateGroupModal from '../community/CreateGroupModal';
import { getInitials, formatDate } from '../../utils/helpers';

const Sidebar = ({
  communities,
  allCommunities,
  selectedCommunity,
  onSelectCommunity,
  onJoinCommunity,
  onCreateCommunity,
  sidebarTab,
  setSidebarTab,
  isOpen,
  onClose,
  navigate
}) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter communities based on search
  const filteredCommunities = (sidebarTab === 'my' ? communities : allCommunities)
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Check if user is already a member
  const isMember = (community) => {
    return community.members?.some(m => (m._id || m) === user?._id);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="logo">
            <MdBloodtype className="logo-icon" />
            <h2>BloodConnect</h2>
          </div>
          <div className="sidebar-actions">
            <button className="btn btn-icon btn-ghost" onClick={() => setShowCreateModal(true)} title="Create Group">
              <FiPlus />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <div className="input-icon">
            <FiSearch className="icon" />
            <input
              type="text"
              className="input"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="sidebar-nav">
          <button
            className={sidebarTab === 'my' ? 'active' : ''}
            onClick={() => setSidebarTab('my')}
          >
            <FiUsers style={{ marginRight: 4 }} /> My Groups
          </button>
          <button
            className={sidebarTab === 'explore' ? 'active' : ''}
            onClick={() => setSidebarTab('explore')}
          >
            <FiCompass style={{ marginRight: 4 }} /> Explore
          </button>
        </div>

        {/* Community List */}
        <div className="sidebar-list">
          {filteredCommunities.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <p style={{ fontSize: '0.8rem' }}>
                {sidebarTab === 'my'
                  ? 'No groups joined yet. Explore & join!'
                  : 'No communities found.'}
              </p>
            </div>
          ) : (
            filteredCommunities.map(community => (
              <div
                key={community._id}
                className={`group-item ${selectedCommunity?._id === community._id ? 'active' : ''}`}
                onClick={() => {
                  if (sidebarTab === 'explore' && !isMember(community)) {
                    onJoinCommunity(community._id);
                  } else {
                    onSelectCommunity(community);
                  }
                }}
              >
                <div className="avatar" style={{ background: `linear-gradient(135deg, ${community.avatar || '#DC143C'}, #A0102D)` }}>
                  {getInitials(community.name)}
                </div>
                <div className="group-item-info">
                  <h4>{community.name}</h4>
                  <p>
                    {sidebarTab === 'explore' && !isMember(community)
                      ? `${community.members?.length || 0} members · Click to join`
                      : `${community.members?.length || 0} members`
                    }
                  </p>
                </div>
                {sidebarTab === 'explore' && !isMember(community) && (
                  <button className="btn btn-sm btn-primary" onClick={(e) => {
                    e.stopPropagation();
                    onJoinCommunity(community._id);
                  }}>
                    Join
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Bottom Nav */}
        <div style={{
          padding: '8px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'space-around'
        }}>
          <button className="btn btn-icon btn-ghost" onClick={() => navigate('/profile')} title="Profile">
            <FiUser />
          </button>
          <button className="btn btn-icon btn-ghost" onClick={() => navigate('/dashboard')} title="Dashboard">
            <FiBarChart2 />
          </button>
          <button className="btn btn-icon btn-ghost" onClick={() => navigate('/blood-banks')} title="Blood Banks">
            <FiMap />
          </button>
          <button className="btn btn-icon btn-ghost" onClick={handleLogout} title="Logout" style={{ color: 'var(--critical)' }}>
            <FiLogOut />
          </button>
        </div>
      </aside>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={onCreateCommunity}
        />
      )}
    </>
  );
};

export default Sidebar;
