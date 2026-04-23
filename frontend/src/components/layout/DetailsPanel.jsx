/**
 * Details Panel Component
 * Right panel showing community info, members, and actions
 */

import { FiX, FiUsers, FiLogOut, FiShield, FiTrash2, FiCalendar } from 'react-icons/fi';
import { MdBloodtype, MdVerified } from 'react-icons/md';
import { getInitials, getAvatarColor, formatDate } from '../../utils/helpers';

const DetailsPanel = ({ community, isOpen, onClose, onLeaveCommunity, onRemoveMember, user }) => {
  if (!community) return null;

  const isLeader = (community.leader?._id || community.leader) === user?._id;

  return (
    <div className={`details-panel ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="details-header">
        <h3>Group Info</h3>
        <button className="btn btn-icon btn-ghost" onClick={onClose}>
          <FiX />
        </button>
      </div>

      {/* Community Info */}
      <div className="details-community-info">
        <div className="avatar avatar-xl" style={{
          background: getAvatarColor(community.name),
          margin: '0 auto'
        }}>
          {getInitials(community.name)}
        </div>
        <h3>{community.name}</h3>
        <p>{community.description || 'No description'}</p>

        {/* Stats */}
        <div className="details-stats">
          <div className="details-stat">
            <div className="value">{community.members?.length || 0}</div>
            <div className="label">Members</div>
          </div>
          <div className="details-stat">
            <div className="value">{community.messageCount || 0}</div>
            <div className="label">Messages</div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {community.tags?.length > 0 && (
        <div className="details-section">
          <h4>Tags</h4>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {community.tags.map((tag, i) => (
              <span key={i} className="community-tag">#{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Created */}
      <div className="details-section">
        <h4>Created</h4>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiCalendar /> {new Date(community.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Members */}
      <div className="details-section">
        <h4><FiUsers style={{ marginRight: 4 }} /> Members ({community.members?.length || 0})</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
          {community.members?.map(member => {
            const memberId = member._id || member;
            const memberIsLeader = (community.leader?._id || community.leader) === memberId;

            return (
              <div key={memberId} className="member-item">
                <div className="avatar avatar-sm" style={{ background: getAvatarColor(member.name) }}>
                  {getInitials(member.name)}
                </div>
                <div className="member-info">
                  <h5>
                    {member.name || 'Unknown'}
                    {memberIsLeader && <span className="leader-badge"><FiShield size={10} /> Leader</span>}
                    {member.isVerifiedDonor && <MdVerified style={{ color: 'var(--accent-green)', fontSize: '14px' }} />}
                  </h5>
                  <p>
                    {member.bloodGroup && <span className="badge badge-blood" style={{ fontSize: '9px', padding: '1px 5px' }}>{member.bloodGroup}</span>}
                    {member.isOnline && <span className="badge-online" style={{ marginLeft: '6px' }} />}
                  </p>
                </div>

                {/* Remove button (leader only, can't remove self) */}
                {isLeader && memberId !== user._id && (
                  <button
                    className="btn btn-icon btn-ghost"
                    style={{ color: 'var(--critical)', fontSize: '0.85rem' }}
                    onClick={() => onRemoveMember(memberId)}
                    title="Remove member"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="details-section" style={{ borderBottom: 'none' }}>
        {!isLeader && (
          <button
            className="btn btn-danger btn-full"
            onClick={() => onLeaveCommunity(community._id)}
          >
            <FiLogOut /> Leave Group
          </button>
        )}
        {isLeader && (
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
            You're the leader of this group
          </p>
        )}
      </div>
    </div>
  );
};

export default DetailsPanel;
