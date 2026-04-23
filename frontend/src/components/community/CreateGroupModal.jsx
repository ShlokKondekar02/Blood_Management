/**
 * Create Group Modal
 * Form to create a new community group
 */

import { useState } from 'react';
import { FiX, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CreateGroupModal = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim(), tags });
      toast.success('Group created! 🎉');
      onClose();
    } catch (err) {
      toast.error('Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><FiUsers style={{ marginRight: 8 }} /> Create New Group</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}><FiX /></button>
        </div>
        <form className="modal-body create-group-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Group Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Mumbai Blood Heroes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              className="textarea"
              placeholder="What is this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="input-group">
            <label>Tags (press Enter to add)</label>
            <div className="tags-input">
              {tags.map(tag => (
                <span key={tag} className="tag-chip">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
              <input
                type="text"
                placeholder={tags.length < 5 ? "Add tag..." : "Max 5 tags"}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                disabled={tags.length >= 5}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <span className="loader loader-sm" /> : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
