import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, Link, Clock, Phone, Users, Trash2, ExternalLink, Loader } from 'lucide-react';

const Settings = ({ showToast }) => {
  const { user } = useAuth();
  const [cronTimeMorning, setCronTimeMorning] = useState('14:30');
  const [cronTimeEvening, setCronTimeEvening] = useState('17:30');
  const [minCallsTarget, setMinCallsTarget] = useState(60);
  const [bdas, setBdas] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBda, setSavingBda] = useState(null);
  const [clearingTeam, setClearingTeam] = useState('');

  useEffect(() => {
    Promise.all([fetchConfig(), fetchBdas(), fetchTeams()]).finally(() => setLoading(false));
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        const c = data.config || {};
        if (c.cronTimeMorning) setCronTimeMorning(c.cronTimeMorning);
        if (c.cronTimeEvening) setCronTimeEvening(c.cronTimeEvening);
        if (c.minCallsTarget) setMinCallsTarget(Number(c.minCallsTarget));
      }
    } catch (err) {
      console.error('Fetch config error:', err);
    }
  };

  const fetchBdas = async () => {
    try {
      const res = await fetch('/api/settings/bdas');
      if (res.ok) {
        const data = await res.json();
        setBdas(data.bdas || []);
      }
    } catch (err) {
      console.error('Fetch BDAs error:', err);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/employees/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
      }
    } catch (err) {
      console.error('Fetch teams error:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cronTimeMorning, cronTimeEvening, minCallsTarget: Number(minCallsTarget) }),
      });
      if (res.ok) {
        showToast('Platform settings saved.');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to save', true);
      }
    } catch (err) {
      showToast('Connection error', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTarget = async (bdaId, targetCalls) => {
    setSavingBda(bdaId);
    try {
      const res = await fetch(`/api/settings/bdas/${bdaId}/target`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCalls: Number(targetCalls) || 0 }),
      });
      if (res.ok) {
        showToast('Target calls updated.');
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update', true);
      }
    } catch (err) {
      showToast('Connection error', true);
    } finally {
      setSavingBda(null);
    }
  };

  const handleClearMasterSheet = async (teamId) => {
    if (!window.confirm(`Clear master sheet URL for team "${teams.find(t => t.id === teamId)?.name || teamId}"?`)) return;
    setClearingTeam(teamId);
    try {
      const res = await fetch(`/api/settings/clear-master-sheet/${teamId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        fetchTeams();
      } else {
        showToast(data.message || 'Failed to clear', true);
      }
    } catch (err) {
      showToast('Connection error', true);
    } finally {
      setClearingTeam('');
    }
  };

  if (loading) {
    return <div className="view-section active" style={{ textAlign: 'center', padding: '3rem' }}>Loading settings...</div>;
  }

  return (
    <div className="view-section active" id="settings-view">
      <div className="content-card" style={{ maxWidth: '700px', marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Platform Settings</h3>
        </div>

        <form onSubmit={handleSaveSettings}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} />
                Morning Sync Time
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
                Evening Sync Time
              </label>
              <input
                type="time"
                value={cronTimeEvening}
                onChange={(e) => setCronTimeEvening(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label>Minimum Required Daily Calling Target</label>
            <input
              type="number"
              value={minCallsTarget}
              onChange={(e) => setMinCallsTarget(e.target.value)}
              required
              min="0"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Agents below this daily call count trigger low performance alerts.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Platform Settings'}
          </button>
        </form>
      </div>

      <div className="content-card" style={{ maxWidth: '700px', marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} /> BDA Target Calls
          </h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Set daily call targets per BDA. Used for performance scoring and alerts.
        </p>

        {bdas.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No active BDAs found.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>BDA</th>
                  <th>Team</th>
                  <th>Target Calls</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bdas.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.teamName}</td>
                    <td>
                      <input
                        type="number"
                        className="table-input"
                        defaultValue={b.targetCalls || 0}
                        id={`target-${b.id}`}
                        min="0"
                        style={{ width: '90px' }}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => handleSaveTarget(b.id, document.getElementById(`target-${b.id}`).value)}
                        disabled={savingBda === b.id}
                      >
                        {savingBda === b.id ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="content-card" style={{ maxWidth: '700px' }}>
        <div className="card-header" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link size={18} /> Remove Master Sheet
          </h3>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Clearing a team's master sheet URL disconnects the Google Sheet integration.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            style={{
              flex: 1, minWidth: '250px', padding: '0.5rem 0.75rem',
              border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem',
            }}
          >
            <option value="">— Select a Team —</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} {t.leadName ? `(Lead: ${t.leadName})` : ''}
              </option>
            ))}
          </select>
          <button
            className="btn btn-danger"
            onClick={() => handleClearMasterSheet(selectedTeam)}
            disabled={!selectedTeam || clearingTeam === selectedTeam}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
          >
            {clearingTeam === selectedTeam ? (
              <Loader size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Clear Master Sheet
          </button>
        </div>

        {selectedTeam && teams.find(t => t.id === selectedTeam) && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ExternalLink size={12} />
            Team: <strong>{teams.find(t => t.id === selectedTeam)?.name}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
