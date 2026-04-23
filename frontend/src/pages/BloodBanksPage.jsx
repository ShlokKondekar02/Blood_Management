/**
 * Blood Banks Page
 * Directory of nearby blood banks and hospitals
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch, FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { MdBloodtype, MdLocalHospital } from 'react-icons/md';
import API from '../api/axios';
import '../styles/dashboard.css';

const BloodBanksPage = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const { data } = await API.get('/blood-banks');
      if (data.success) setBanks(data.banks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchCity) params.append('city', searchCity);
      if (filterType) params.append('type', filterType);

      const { data } = await API.get(`/blood-banks/search?${params}`);
      if (data.success) setBanks(data.banks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const map = {
      blood_bank: { label: 'Blood Bank', className: 'type-blood-bank' },
      hospital: { label: 'Hospital', className: 'type-hospital' },
      donation_center: { label: 'Donation Center', className: 'type-center' }
    };
    return map[type] || { label: type, className: '' };
  };

  return (
    <div className="app-layout">
      <div className="blood-banks-page">
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: '16px' }}>
          <FiArrowLeft /> Back to Chat
        </button>

        <div className="blood-banks-header">
          <h2><MdLocalHospital style={{ marginRight: 8, color: 'var(--primary)' }} /> Nearby Blood Banks & Hospitals</h2>
          <div className="blood-banks-filters">
            <input
              className="input"
              placeholder="Search city..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <select className="select" value={filterType} onChange={(e) => { setFilterType(e.target.value); }}>
              <option value="">All Types</option>
              <option value="blood_bank">Blood Banks</option>
              <option value="hospital">Hospitals</option>
              <option value="donation_center">Donation Centers</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={handleSearch}>
              <FiSearch /> Search
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loader-container"><div className="loader" /></div>
        ) : banks.length === 0 ? (
          <div className="empty-state">
            <MdLocalHospital className="icon" />
            <h3>No blood banks found</h3>
            <p>Try searching for a different city</p>
          </div>
        ) : (
          <div className="blood-banks-grid">
            {banks.map(bank => {
              const typeBadge = getTypeBadge(bank.type);
              return (
                <div key={bank._id} className="blood-bank-card animate-fade-in-up">
                  <h3>
                    {bank.type === 'hospital' ? <MdLocalHospital /> : <MdBloodtype />}
                    {bank.name}
                    <span className={`type-badge ${typeBadge.className}`}>{typeBadge.label}</span>
                  </h3>
                  <div className="blood-bank-info">
                    <span><FiMapPin /> {bank.address}, {bank.city}{bank.state ? `, ${bank.state}` : ''}</span>
                    {bank.phone && <span><FiPhone /> {bank.phone}</span>}
                    {bank.email && <span><FiMail /> {bank.email}</span>}
                    <span><FiClock /> {bank.operatingHours}</span>
                  </div>
                  {bank.availableGroups?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '6px' }}>Available Blood Groups:</p>
                      <div className="blood-bank-groups">
                        {bank.availableGroups.map(bg => (
                          <span key={bg} className="badge badge-blood">{bg}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodBanksPage;
