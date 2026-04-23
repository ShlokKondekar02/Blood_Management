/**
 * Blood Request Form Modal
 * Create urgent blood donation requests
 */

import { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { MdBloodtype } from 'react-icons/md';
import { BLOOD_GROUPS, URGENCY_LEVELS, REQUEST_TYPES } from '../../utils/constants';

const RequestForm = ({ community, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    bloodGroup: 'O+',
    urgency: 'urgent',
    location: '',
    hospitalName: '',
    contactNumber: '',
    unitsNeeded: 1,
    description: '',
    requestType: 'self'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location || !formData.contactNumber) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
        <div className="modal-header" style={{ background: 'var(--critical-bg)' }}>
          <h2 style={{ color: 'var(--critical)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiAlertTriangle /> Blood Request
          </h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><FiX /></button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Blood Group & Urgency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Blood Group *</label>
              <select name="bloodGroup" className="select" value={formData.bloodGroup} onChange={handleChange}>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Urgency *</label>
              <select name="urgency" className="select" value={formData.urgency} onChange={handleChange}>
                {URGENCY_LEVELS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>

          {/* Request Type & Units */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="input-group">
              <label>Request For</label>
              <select name="requestType" className="select" value={formData.requestType} onChange={handleChange}>
                {REQUEST_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Units Needed</label>
              <input
                type="number"
                name="unitsNeeded"
                className="input"
                value={formData.unitsNeeded}
                onChange={handleChange}
                min={1}
                max={10}
              />
            </div>
          </div>

          {/* Location */}
          <div className="input-group">
            <label>Location / Area *</label>
            <input
              type="text"
              name="location"
              className="input"
              placeholder="City, area, or hospital address"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          {/* Hospital */}
          <div className="input-group">
            <label>Hospital Name</label>
            <input
              type="text"
              name="hospitalName"
              className="input"
              placeholder="Hospital name (if admitted)"
              value={formData.hospitalName}
              onChange={handleChange}
            />
          </div>

          {/* Contact */}
          <div className="input-group">
            <label>Contact Number *</label>
            <input
              type="text"
              name="contactNumber"
              className="input"
              placeholder="+91-9876543210"
              value={formData.contactNumber}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="input-group">
            <label>Additional Details</label>
            <textarea
              name="description"
              className="textarea"
              placeholder="Any additional information..."
              value={formData.description}
              onChange={handleChange}
              rows={2}
            />
          </div>

          <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
              {isSubmitting ? <span className="loader loader-sm" /> : (
                <><MdBloodtype /> Send Request</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestForm;
