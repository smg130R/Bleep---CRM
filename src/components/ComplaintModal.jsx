import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

const ComplaintModal = ({ isOpen, onClose, onSubmit }) => {
  const [recipient, setRecipient] = useState('admin');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject || !details) {
      alert('Subject and Details are required.');
      return;
    }
    onSubmit({ recipientRole: recipient, subject, details });
    setSubject('');
    setDetails('');
  };

  return (
    <div className="modal-overlay show" id="complaint-modal">
      <div className="modal-container" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">File an Official Complaint</h3>
          <button className="modal-close" id="complaint-modal-close-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="input-group">
              <label htmlFor="complaint-recipient">Direct Complaint To</label>
              <select 
                id="complaint-recipient" 
                className="table-select"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
              >
                <option value="admin">System Administrator</option>
                <option value="hr">HR Department</option>
                <option value="team_lead">Team Lead</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="complaint-subject">Subject / Area of Concern</label>
              <input 
                type="text" 
                id="complaint-subject" 
                placeholder="Briefly state the issue..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="complaint-details">Detailed Explanation</label>
              <textarea 
                id="complaint-details" 
                placeholder="Provide details about the issue, including dates or names if necessary..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={5}
                required
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              id="complaint-modal-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              id="complaint-modal-save-btn"
              style={{ background: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Send size={14} />
              Submit Complaint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintModal;
