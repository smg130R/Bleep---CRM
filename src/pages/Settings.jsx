import React, { useState } from 'react';
import { Save, Link, Clock, ShieldCheck } from 'lucide-react';

const Settings = ({ showToast }) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [cronTimeMorning, setCronTimeMorning] = useState('14:30');
  const [cronTimeEvening, setCronTimeEvening] = useState('17:30');
  const [minCallsTarget, setMinCallsTarget] = useState(60);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    showToast('Platform configuration settings saved successfully!');
  };

  return (
    <div className="view-section active" id="settings-view">
      <div className="content-card" style={{ maxWidth: '650px' }}>
        <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Google Sheets Automation Settings</h3>
        </div>

        <form onSubmit={handleSaveSettings}>
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link size={16} />
              Master BDA Calling Sheet Spreadsheet URL Template
            </label>
            <input 
              type="text" 
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              required
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              This layout sheet is used to instantiate fresh calling records daily for newly enrolled BDA recruits.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} />
                Morning Sync Cron Schedule
              </label>
              <input 
                type="time" 
                value={cronTimeMorning}
                onChange={(e) => setCronTimeMorning(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} />
                Evening Sync Cron Schedule
              </label>
              <input 
                type="time" 
                value={cronTimeEvening}
                onChange={(e) => setCronTimeEvening(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="card-header" style={{ marginBottom: '1.25rem', marginTop: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Target KPIs Performance Boundaries</h3>
          </div>

          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label>Minimum Required Daily Calling Target</label>
            <input 
              type="number" 
              value={minCallsTarget}
              onChange={(e) => setMinCallsTarget(e.target.value)}
              required
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Agents falling below this threshold in total daily outbound calls will trigger low performance warning alerts.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}
          >
            <Save size={16} />
            Save Platform Settings
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
