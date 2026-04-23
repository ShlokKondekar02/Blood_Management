/**
 * Profile Page
 * User profile with stats, certificates, donation history
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiUpload, FiAward, FiUsers, FiHeart, FiMapPin, FiPhone, FiMail, FiSave, FiX } from 'react-icons/fi';
import { MdBloodtype, MdVerified } from 'react-icons/md';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import API from '../api/axios';
import { BLOOD_GROUPS } from '../utils/constants';
import { getInitials, getAvatarColor, formatDate } from '../utils/helpers';
import '../styles/profile.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', hospitalName: '', donationDate: '' });

  // Fetch certificates
  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const { data } = await API.get('/certificates/my');
        if (data.success) setCertificates(data.certificates);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCerts();
  }, []);

  // Start editing
  const startEdit = () => {
    setEditData({
      name: user.name,
      phone: user.phone || '',
      location: user.location || '',
      bio: user.bio || '',
      bloodGroup: user.bloodGroup
    });
    setIsEditing(true);
  };

  // Save profile
  const saveProfile = async () => {
    try {
      const { data } = await API.put('/users/profile', editData);
      if (data.success) {
        updateUser(data.user);
        toast.success('Profile updated!');
        setIsEditing(false);
      }
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  // Upload certificate
  const handleUploadCert = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('certificate', file);
    formData.append('title', uploadForm.title || 'Donation Certificate');
    formData.append('hospitalName', uploadForm.hospitalName);
    formData.append('donationDate', uploadForm.donationDate || new Date().toISOString());

    setUploading(true);
    try {
      const { data } = await API.post('/certificates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        setCertificates(prev => [data.certificate, ...prev]);
        updateUser({ donationCount: (user.donationCount || 0) + 1 });
        toast.success('Certificate uploaded! 🎉');
        setUploadForm({ title: '', hospitalName: '', donationDate: '' });
      }
    } catch (err) {
      toast.error('Failed to upload certificate');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="app-layout">
      <div className="profile-page">
        {/* Back button */}
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: '16px' }}>
          <FiArrowLeft /> Back to Chat
        </button>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="avatar avatar-xl" style={{ background: getAvatarColor(user?.name) }}>
            {getInitials(user?.name)}
          </div>
          <div className="profile-info" style={{ flex: 1 }}>
            {isEditing ? (
              <div className="edit-profile-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label>Name</label>
                    <input className="input" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Blood Group</label>
                    <select className="select" value={editData.bloodGroup} onChange={e => setEditData({ ...editData, bloodGroup: e.target.value })}>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Phone</label>
                    <input className="input" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Location</label>
                    <input className="input" value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Bio</label>
                  <textarea className="textarea" value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} rows={2} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary btn-sm" onClick={saveProfile}><FiSave /> Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}><FiX /> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h2>
                  {user?.name}
                  {user?.isVerifiedDonor && <MdVerified style={{ color: 'var(--accent-green)', fontSize: '20px' }} />}
                  <span className="badge badge-blood" style={{ marginLeft: '8px' }}>{user?.bloodGroup}</span>
                </h2>
                <p className="email"><FiMail style={{ marginRight: 4 }} /> {user?.email}</p>
                {user?.phone && <p className="email"><FiPhone style={{ marginRight: 4 }} /> {user?.phone}</p>}
                {user?.location && <p className="email"><FiMapPin style={{ marginRight: 4 }} /> {user?.location}</p>}
                {user?.bio && <p className="bio">{user?.bio}</p>}
                <button className="btn btn-secondary btn-sm" onClick={startEdit} style={{ marginTop: '12px' }}>
                  <FiEdit2 /> Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          <div className="profile-stat-card">
            <div className="icon"><FiHeart /></div>
            <div className="value">{user?.donationCount || 0}</div>
            <div className="label">Donations</div>
          </div>
          <div className="profile-stat-card">
            <div className="icon"><FiUsers /></div>
            <div className="value">{user?.joinedCommunities?.length || 0}</div>
            <div className="label">Communities</div>
          </div>
          <div className="profile-stat-card">
            <div className="icon"><FiAward /></div>
            <div className="value">{certificates.length}</div>
            <div className="label">Certificates</div>
          </div>
          <div className="profile-stat-card">
            <div className="icon">{user?.isVerifiedDonor ? <MdVerified /> : <MdBloodtype />}</div>
            <div className="value" style={{ fontSize: 'var(--font-md)' }}>{user?.isVerifiedDonor ? 'Verified' : 'Unverified'}</div>
            <div className="label">Donor Status</div>
          </div>
        </div>

        {/* Certificates Section */}
        <div className="profile-section">
          <h3><FiAward /> Donation Certificates</h3>

          {certificates.length > 0 ? (
            <div className="certificate-list">
              {certificates.map(cert => (
                <div key={cert._id} className="certificate-item">
                  <div className="certificate-info">
                    <div className="certificate-icon">📜</div>
                    <div className="certificate-details">
                      <h5>{cert.title}</h5>
                      <p>{cert.hospitalName || 'N/A'} · {formatDate(cert.donationDate)}</p>
                    </div>
                  </div>
                  <span className={`badge ${cert.isVerified ? 'badge-verified' : 'badge-primary'}`}>
                    {cert.isVerified ? '✓ Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>No certificates uploaded yet.</p>
          )}

          {/* Upload Form */}
          <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
            <h4 style={{ fontSize: 'var(--font-sm)', marginBottom: '12px' }}>Upload New Certificate</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <input className="input" placeholder="Certificate title" value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} />
              <input className="input" placeholder="Hospital name" value={uploadForm.hospitalName} onChange={e => setUploadForm({ ...uploadForm, hospitalName: e.target.value })} />
            </div>
            <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
              {uploading ? <span className="loader loader-sm" /> : <><FiUpload /> Choose File & Upload</>}
              <input type="file" accept="image/*,.pdf" onChange={handleUploadCert} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
