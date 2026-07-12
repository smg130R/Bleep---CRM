import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, Users, Briefcase, UserPlus, FileText, TrendingUp,
  BookOpen, Monitor, Clock, AlertTriangle, LogOut, ArrowUpDown,
  Award, Megaphone, Shield, BarChart3, ClipboardList, Search,
  Plus, Check, X, Edit3, Trash2, Save, Loader, ExternalLink,
  Gift, Bell, Star, Target, MessageSquare, ChevronDown, ChevronUp,
  Phone, Eye, Filter
} from 'lucide-react';

const HR = ['admin', 'hr'];

const HrDesk = ({ showToast, activeHrTab = 'hr-desk' }) => {
  const { user } = useAuth();
  const isHR = HR.includes(user?.role);
  const isAdmin = user?.role === 'admin';

  const [tab, setTab] = useState(activeHrTab === 'hr-desk' ? 'overview' : activeHrTab.replace('hr-', ''));
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [overview, setOverview] = useState({});
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [onboarding, setOnboarding] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [goals, setGoals] = useState([]);
  const [training, setTraining] = useState([]);
  const [skills, setSkills] = useState([]);
  const [assets, setAssets] = useState([]);
  const [disciplinary, setDisciplinary] = useState([]);
  const [exits, setExits] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [probation, setProbation] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recognitions, setRecognitions] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editProfile, setEditProfile] = useState(null);
  const [showForm, setShowForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [calendarWeek, setCalendarWeek] = useState(0);

  useEffect(() => { setTab(activeHrTab === 'hr-desk' ? 'overview' : activeHrTab.replace('hr-', '')); }, [activeHrTab]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const all = [
        fetch('/api/hr/overview').then(r => r.ok ? r.json() : {}),
        fetch('/api/hr/notices').then(r => r.ok ? r.json() : { notices: [] }),
        fetch('/api/hr/planner').then(r => r.ok ? r.json() : { events: [] }),
        fetch('/api/hr/employee-ext').then(r => r.ok ? r.json() : { profiles: [] }),
        fetch('/api/hr/documents').then(r => r.ok ? r.json() : { documents: [] }),
        fetch('/api/hr/recruitment/jobs').then(r => r.ok ? r.json() : { jobs: [] }),
        fetch('/api/hr/recruitment/candidates').then(r => r.ok ? r.json() : { candidates: [] }),
        fetch('/api/hr/recruitment/interviews').then(r => r.ok ? r.json() : { interviews: [] }),
        fetch('/api/hr/onboarding').then(r => r.ok ? r.json() : { onboarding: [] }),
        fetch('/api/hr/performance').then(r => r.ok ? r.json() : { reviews: [] }),
        fetch('/api/hr/goals').then(r => r.ok ? r.json() : { goals: [] }),
        fetch('/api/hr/training').then(r => r.ok ? r.json() : { training: [] }),
        fetch('/api/hr/skills').then(r => r.ok ? r.json() : { skills: [] }),
        fetch('/api/hr/assets').then(r => r.ok ? r.json() : { assets: [] }),
        fetch('/api/hr/disciplinary').then(r => r.ok ? r.json() : { actions: [] }),
        fetch('/api/hr/exit').then(r => r.ok ? r.json() : { exits: [] }),
        fetch('/api/hr/promotions').then(r => r.ok ? r.json() : { promotions: [] }),
        fetch('/api/hr/probation').then(r => r.ok ? r.json() : { probation: [] }),
        fetch('/api/hr/attendance').then(r => r.ok ? r.json() : { attendance: [] }),
        fetch('/api/hr/announcements').then(r => r.ok ? r.json() : { announcements: [] }),
        fetch('/api/hr/recognition').then(r => r.ok ? r.json() : { recognitions: [] }),
        fetch('/api/hr/policies').then(r => r.ok ? r.json() : { policies: [] }),
        fetch('/api/hr/surveys').then(r => r.ok ? r.json() : { surveys: [] }),
        fetch('/api/hr/analytics').then(r => r.ok ? r.json() : {}),
        fetch('/api/hr/audit-log').then(r => r.ok ? r.json() : { logs: [] }),
        fetch('/api/employees').then(r => r.ok ? r.json() : { employees: [] }),
      ];
      const r = await Promise.all(all);
      setOverview(r[0]); setNotices(r[1].notices); setEvents(r[2].events);
      setProfiles(r[3].profiles); setDocuments(r[4].documents);
      setJobs(r[5].jobs); setCandidates(r[6].candidates); setInterviews(r[7].interviews);
      setOnboarding(r[8].onboarding); setReviews(r[9].reviews); setGoals(r[10].goals);
      setTraining(r[11].training); setSkills(r[12].skills); setAssets(r[13].assets);
      setDisciplinary(r[14].actions); setExits(r[15].exits); setPromotions(r[16].promotions);
      setProbation(r[17].probation); setAttendance(r[18].attendance);
      setAnnouncements(r[19].announcements); setRecognitions(r[20].recognitions);
      setPolicies(r[21].policies); setSurveys(r[22].surveys); setAnalytics(r[23]);
      setLogs(r[24].logs); setEmployees(r[25].employees || []);
    } catch (e) { console.error('HR fetch error:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const api = async (path, method = 'GET', body) => {
    try {
      const opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(path, opts);
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Error', true); return null; }
      return data;
    } catch (e) { showToast('Connection error', true); return null; }
  };

  const empName = (id) => employees.find(e => e.id === id)?.name || employees.find(e => e.id === id)?.email || '-';
  const empOpts = () => employees.filter(e => e.status === 'active').map(e => ({ value: e.id, label: `${e.name} (${e.email})` }));
  const leaderOpts = () => employees.filter(e => ['admin', 'hr', 'team_lead', 'ops_head'].includes(e.role)).map(e => ({ value: e.id, label: e.name }));

  const Card = ({ label, value, color }) => (
    <div className="kpi-card" style={{ borderLeft: `4px solid ${color}`, padding: '14px 18px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );

  const Badge = ({ status, map }) => {
    const m = map || { completed:'excellent', active:'good', approved:'excellent', resolved:'excellent', present:'good', verified:'excellent', confirmed:'excellent', rejected:'high', cancelled:'high', suspended:'high', pending:'pending', in_progress:'average', ongoing:'good', scheduled:'pending' };
    const cls = m[status] || 'pending';
    return <span className={`badge ${cls}`} style={{ fontSize: 11, padding: '2px 8px' }}>{status?.replace(/_/g, ' ')}</span>;
  };

  const ProgressBar = ({ value, w = 100 }) => (
    <div style={{ width: w, height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: 6, background: value >= 80 ? 'var(--success)' : value >= 40 ? 'var(--warning)' : 'var(--danger)', borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  );

  const Stars = ({ level }) => (
    <div style={{ display: 'flex', gap: 2 }}>{[1, 2, 3, 4, 5].map(i => (
      <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: i <= level ? '#F59E0B' : 'var(--border-color)' }} />
    ))}</div>
  );

  const Section = ({ title, children, action }) => (
    <div className="content-card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--border-color)', paddingBottom: 10, marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );

  const ModalForm = ({ fields, onSave, onClose }) => {
    const [fd, setFd] = useState({});
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, maxWidth: 560, width: '92%', maxHeight: '85vh', overflow: 'auto' }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>New Entry</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {fields.map(f => {
              const isSelect = f.options || f.type === 'select';
              const isDate = f.type === 'date';
              const isNum = f.type === 'number';
              const isBig = f.type === 'textarea';
              return (
                <div key={f.key} style={{ gridColumn: isBig ? 'span 2' : undefined, marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 3 }}>{f.label}{f.required && ' *'}</label>
                  {isSelect ? (
                    <select className="table-select" value={fd[f.key] || ''} onChange={e => setFd({ ...fd, [f.key]: e.target.value })} style={{ width: '100%' }}>
                      <option value="">{f.placeholder || 'Select...'}</option>
                      {(f.options || []).map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : isBig ? (
                    <textarea className="table-input" rows={3} value={fd[f.key] || ''} onChange={e => setFd({ ...fd, [f.key]: e.target.value })} style={{ width: '100%', resize: 'vertical' }} />
                  ) : (
                    <input className="table-input" type={isDate ? 'date' : isNum ? 'number' : 'text'} value={fd[f.key] || ''} onChange={e => setFd({ ...fd, [f.key]: e.target.value })} placeholder={f.placeholder || f.label} style={{ width: '100%' }} />
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" style={{ padding: '8px 24px' }} onClick={() => onSave(fd)}><Save size={14} /> Save</button>
            <button className="btn btn-secondary" style={{ padding: '8px 24px' }} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="view-section active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}><Loader className="animate-spin" size={32} style={{ marginBottom: 12 }} /><p style={{ color: 'var(--text-muted)' }}>Loading HR module...</p></div>
    </div>
  );

  // ─── OVERVIEW ───────────────────────────────
  if (tab === 'overview') return (
    <div className="view-section active">
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Card label="Total Employees" value={overview.totalEmployees||0} color="#2563EB" />
        <Card label="Active" value={overview.activeEmployees||0} color="#16A34A" />
        <Card label="Suspended" value={overview.suspendedEmployees||0} color="#DC2626" />
        <Card label="On Leave" value={overview.employeesOnLeave||0} color="#F59E0B" />
        <Card label="New Joiners (30d)" value={overview.newJoiners||0} color="#8B5CF6" />
        <Card label="In Probation" value={overview.inProbation||0} color="#EC4899" />
        <Card label="Notice Period" value={overview.inNoticePeriod||0} color="#F97316" />
        <Card label="Resignations" value={overview.recentResignations||0} color="#EF4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Section title="Upcoming Notices & Reminders">
          {notices.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12 }}>No upcoming notices.</p> : (
            <div style={{ maxHeight: 420, overflow: 'auto' }}>
              {notices.slice(0, 40).map((n, i) => {
                const priColor = n.priority === 'urgent' ? '#DC2626' : n.priority === 'high' ? '#D97706' : '#6B7280';
                const priBg = n.priority === 'urgent' ? '#FEE2E2' : n.priority === 'high' ? '#FEF3C7' : '#F3F4F6';
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ color: priColor, flexShrink: 0, marginTop: 2 }}>
                      {n.type === 'birthday' ? <Gift size={15} /> : n.type === 'probation_end' ? <ClipboardList size={15} /> :
                       n.type === 'document_expiry' ? <FileText size={15} /> : n.type === 'training_expiry' ? <BookOpen size={15} /> :
                       n.type === 'event' ? <Calendar size={15} /> : n.type === 'exit' ? <LogOut size={15} /> :
                       n.type === 'review' ? <TrendingUp size={15} /> : <Bell size={15} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{n.date}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 10, background: priBg, color: priColor, whiteSpace: 'nowrap', alignSelf: 'center' }}>{n.priority}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="Today's Events" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setShowForm('planner')}><Plus size={12} /></button>}>
          {events.filter(e => e.startDate === new Date().toISOString().split('T')[0] || e.status === 'scheduled').slice(0, 12).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12 }}>No events today.</p>
          ) : (
            events.filter(e => e.startDate === new Date().toISOString().split('T')[0] || e.status === 'scheduled').slice(0, 12).map(e => (
              <div key={e.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                <Calendar size={15} style={{ color: '#2563EB', flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{e.title}</div><div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{e.startDate} {e.startTime} &middot; {e.eventType?.replace(/_/g, ' ')}</div></div>
                <Badge status={e.status} map={{ scheduled:'pending', in_progress:'average', completed:'excellent', cancelled:'high' }} />
              </div>
            ))
          )}
        </Section>
      </div>

      {/* Quick employee list */}
      <Section title="Employee Roster">
        <div style={{ maxHeight: 300, overflow: 'auto' }}>
          <table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Team</th></tr></thead>
            <tbody>{employees.slice(0, 50).map(e => (
              <tr key={e.id}><td style={{ fontWeight: 600 }}>{e.name}</td><td style={{ fontSize: 12 }}>{e.email}</td><td style={{ fontSize: 12 }}>{e.role}</td>
                <td><Badge status={e.status} /></td><td style={{ fontSize: 12 }}>{e.teamId || '-'}</td></tr>
            ))}</tbody></table>
        </div>
      </Section>
    </div>
  );

  // ─── PLANNER ────────────────────────────────
  if (tab === 'planner') return (
    <div className="view-section active">
      <Section title="HR Planner" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setShowForm('planner')}><Plus size={12} /> Event</button>}>
        {showForm === 'planner' && (
          <ModalForm fields={[
            { key: 'title', label: 'Title', required: true }, { key: 'eventType', label: 'Type', type: 'select', options: ['meeting', 'one_on_one', 'performance_review', 'interview', 'induction', 'training', 'team_meeting', 'disciplinary', 'exit_interview', 'recruitment', 'onboarding', 'joining', 'probation_review', 'appraisal', 'company_event', 'reminder'] },
            { key: 'startDate', label: 'Date', type: 'date', required: true }, { key: 'startTime', label: 'Time', type: 'text', placeholder: '09:00' },
            { key: 'participantIds', label: 'Participants', type: 'select', options: empOpts() },
          ]} onSave={async d => { d.participantIds = d.participantIds ? [Number(d.participantIds)] : []; const r = await api('/api/hr/planner', 'POST', d); if (r) { showToast('Event created'); setShowForm(null); fetchAll(); } }} onClose={() => setShowForm(null)} />
        )}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0', fontWeight: 500 }}>Filter:</span>
          {['all', 'scheduled', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => {}} style={{ padding: '4px 12px', fontSize: 11, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-primary)' }}>{s}</button>
          ))}
        </div>
        <div className="table-responsive" style={{ maxHeight: 520, overflow: 'auto' }}>
          <table className="data-table"><thead><tr><th style={{width:100}}>Date</th><th style={{width:70}}>Time</th><th>Title</th><th>Type</th><th style={{width:90}}>Status</th><th>Participants</th></tr></thead>
            <tbody>{events.length === 0 ? <tr><td colSpan={6} style={{ textAlign:'center', padding:24, color:'var(--text-muted)' }}>No events. Create one to get started.</td></tr> : events.map(e => (
              <tr key={e.id}><td style={{ fontSize:12, whiteSpace:'nowrap' }}>{e.startDate}</td><td style={{ fontSize:12 }}>{e.startTime}</td><td style={{ fontWeight:600, fontSize:13 }}>{e.title}</td><td style={{ fontSize:12 }}>{e.eventType?.replace(/_/g,' ')}</td>
                <td><Badge status={e.status} map={{ scheduled:'pending', in_progress:'average', completed:'excellent', cancelled:'high', rescheduled:'pending' }} /></td>
                <td style={{ fontSize:12 }}>{(e.participants||[]).map(p => p.user?.name).filter(Boolean).join(', ') || '-'}</td>
              </tr>
            ))}</tbody></table>
        </div>
      </Section>
    </div>
  );

  // ─── RECRUITMENT ────────────────────────────
  if (tab === 'recruitment') return (
    <div className="view-section active">
      <Section title="Job Openings" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setShowForm('job')}><Plus size={12} /> Job</button>}>
        {showForm === 'job' && <ModalForm fields={[{key:'title',label:'Title',required:true},{key:'department',label:'Department'},{key:'location',label:'Location'},{key:'employmentType',label:'Type',type:'select',options:['Full-time','Part-time','Contract','Intern','Temporary']},{key:'openings',label:'Openings',type:'number'},{key:'description',label:'Description',type:'textarea'}]} onSave={async d=>{const r=await api('/api/hr/recruitment/jobs','POST',d);if(r){showToast('Job created');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)} />}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Title</th><th>Dept</th><th>Location</th><th style={{width:60}}>Openings</th><th style={{width:60}}>Filled</th><th style={{width:90}}>Status</th></tr></thead>
          <tbody>{jobs.map(j => <tr key={j.id}><td style={{fontWeight:600}}>{j.title}</td><td style={{fontSize:12}}>{j.department}</td><td style={{fontSize:12}}>{j.location}</td><td>{j.openings}</td><td>{j.filledCount}</td><td><Badge status={j.status} map={{open:'good',in_progress:'average',closed:'high',on_hold:'pending'}}/></td></tr>)}</tbody></table></div>
      </Section>
      <Section title="Candidates" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setShowForm('candidate')}><Plus size={12} /> Add</button>}>
        {showForm === 'candidate' && <ModalForm fields={[{key:'name',label:'Name',required:true},{key:'email',label:'Email'},{key:'phone',label:'Phone'},{key:'jobId',label:'Job',type:'select',options:jobs.map(j=>({value:j.id,label:j.title}))},{key:'currentCompany',label:'Current Company'},{key:'experienceYears',label:'Experience (yrs)',type:'number'},{key:'status',label:'Status',type:'select',options:['new','screened','shortlisted','interview_scheduled','interviewed','selected','offered','offer_accepted','joined','rejected','on_hold']},{key:'source',label:'Source'}]} onSave={async d=>{if(d.jobId)d.jobId=Number(d.jobId);const r=await api('/api/hr/recruitment/candidates','POST',d);if(r){showToast('Candidate added');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)} />}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Name</th><th>Job</th><th>Phone</th><th>Company</th><th>Exp</th><th style={{width:100}}>Status</th></tr></thead>
          <tbody>{candidates.map(c => <tr key={c.id}><td style={{fontWeight:600}}>{c.name}</td><td style={{fontSize:12}}>{c.job?.title||'-'}</td><td style={{fontSize:12}}>{c.phone}</td><td style={{fontSize:12}}>{c.currentCompany||'-'}</td><td>{c.experienceYears}y</td><td><Badge status={c.status} map={{new:'pending',screened:'average',shortlisted:'good',interview_scheduled:'pending',interviewed:'average',selected:'good',offered:'pending',offer_accepted:'excellent',joined:'excellent',rejected:'high',on_hold:'pending'}}/></td></tr>)}</tbody></table></div>
      </Section>
      <Section title="Interview Schedule" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setShowForm('interview')}><Plus size={12} /> Schedule</button>}>
        {showForm === 'interview' && <ModalForm fields={[{key:'candidateId',label:'Candidate',type:'select',required:true,options:candidates.map(c=>({value:c.id,label:c.name}))},{key:'jobId',label:'Job',type:'select',options:jobs.map(j=>({value:j.id,label:j.title}))},{key:'interviewType',label:'Type',type:'select',options:['Telephonic','Technical','HR','Managerial','Final','Group','Other']},{key:'interviewDate',label:'Date',type:'date',required:true},{key:'interviewTime',label:'Time',placeholder:'10:00'},{key:'mode',label:'Mode',type:'select',options:['in_person','video_call','telephonic']}]} onSave={async d=>{d.candidateId=Number(d.candidateId);if(d.jobId)d.jobId=Number(d.jobId);const r=await api('/api/hr/recruitment/interviews','POST',d);if(r){showToast('Interview scheduled');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)} />}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Candidate</th><th>Job</th><th>Date</th><th>Type</th><th>Mode</th><th style={{width:90}}>Status</th><th>Rating</th></tr></thead>
          <tbody>{interviews.map(i => <tr key={i.id}><td style={{fontWeight:600}}>{i.candidate?.name}</td><td style={{fontSize:12}}>{i.job?.title||'-'}</td><td style={{fontSize:12}}>{i.interviewDate}</td><td style={{fontSize:12}}>{i.interviewType}</td><td style={{fontSize:12}}>{i.mode?.replace(/_/g,' ')}</td><td><Badge status={i.status} map={{scheduled:'pending',completed:'excellent',cancelled:'high',rescheduled:'pending'}}/></td><td>{i.rating||'-'}</td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── DOCUMENTS ──────────────────────────────
  if (tab === 'documents') return (
    <div className="view-section active">
      <Section title="Employee Documents" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setShowForm('document')}><Plus size={12} /> Add</button>}>
        {showForm === 'document' && <ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'documentType',label:'Type',type:'select',required:true,options:['Aadhaar','PAN','Passport','Voter ID','Driving License','Educational Certificate','Experience Letter','Offer Letter','Appointment Letter','NDA','Contract','Bank Details','Tax Document','Emergency Contact','Other']},{key:'documentName',label:'Name',required:true},{key:'fileUrl',label:'File URL'},{key:'issueDate',label:'Issue Date',type:'date'},{key:'expiryDate',label:'Expiry Date',type:'date'}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/documents','POST',d);if(r){showToast('Document added');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)} />}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Document</th><th>Type</th><th style={{width:100}}>Expiry</th><th style={{width:100}}>Verification</th><th style={{width:80}}>Actions</th></tr></thead>
          <tbody>{documents.map(d => {
            const isExpired = d.expiryDate && d.expiryDate < new Date().toISOString().split('T')[0];
            return <tr key={d.id}><td style={{fontWeight:600,fontSize:13}}>{d.users?.name}</td><td>{d.documentName}</td><td style={{fontSize:12}}>{d.documentType}</td>
              <td style={{fontSize:12,color:isExpired?'var(--danger)':'inherit',fontWeight:isExpired?600:400}}>{d.expiryDate||'-'}{isExpired&&' ⚠'}</td>
              <td><Badge status={d.verificationStatus} map={{verified:'excellent',unverified:'pending',rejected:'high'}}/></td>
              <td>{isHR && d.verificationStatus !== 'verified' && <button className="btn btn-primary" style={{padding:'3px 8px',fontSize:11}} onClick={async()=>{await api(`/api/hr/documents/${d.id}/verify`,'PUT',{verificationStatus:'verified'});fetchAll();}}><Check size={11}/></button>}</td>
            </tr>
          })}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── ATTENDANCE ─────────────────────────────
  if (tab === 'attendance') return (
    <div className="view-section active">
      <Section title="Attendance Records">
        <div className="dashboard-grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))',gap:10,marginBottom:16}}>
          {(() => { const s = {}; attendance.forEach(a => { s[a.status] = (s[a.status] || 0) + 1; }); return Object.entries(s).map(([k, v]) => <Card key={k} label={k} value={v} color={k==='present'?'#16A34A':k==='absent'?'#DC2626':k==='late'?'#F59E0B':k==='wfh'?'#8B5CF6':'#6B7280'}/>); })()}
        </div>
        <div className="table-responsive" style={{maxHeight:500,overflow:'auto'}}><table className="data-table"><thead><tr><th>Employee</th><th>Date</th><th>In</th><th>Out</th><th style={{width:80}}>Status</th><th style={{width:60}}>Late</th><th style={{width:60}}>OT</th></tr></thead>
          <tbody>{attendance.slice(0,150).map(a => <tr key={a.id}><td style={{fontWeight:600,fontSize:13}}>{a.user?.name}</td><td style={{fontSize:12}}>{a.date}</td><td style={{fontSize:12}}>{a.clockIn||'-'}</td><td style={{fontSize:12}}>{a.clockOut||'-'}</td>
            <td><Badge status={a.status}/></td><td style={{fontSize:12}}>{a.lateMinutes||0}m</td><td style={{fontSize:12}}>{a.overtimeMinutes||0}m</td>
          </tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── ANNOUNCEMENTS ──────────────────────────
  if (tab === 'announcements') return (
    <div className="view-section active">
      <Section title="Announcements" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setShowForm('announcement')}><Plus size={12} /> Post</button>}>
        {showForm === 'announcement' && <ModalForm fields={[{key:'title',label:'Title',required:true},{key:'content',label:'Content',type:'textarea',required:true},{key:'category',label:'Category',type:'select',options:['general','hr_update','policy','event','celebration','achievement','training','urgent','other']},{key:'priority',label:'Priority',type:'select',options:['low','normal','high','urgent']}]} onSave={async d=>{const r=await api('/api/hr/announcements','POST',d);if(r){showToast('Posted');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)} />}
        <div style={{display:'grid',gap:14}}>{(announcements||[]).map(a => (
          <div key={a.id} style={{padding:16,borderRadius:10,border:'1px solid var(--border-color)',background:a.priority==='urgent'?'#FEF2F2':a.priority==='high'?'#FFFBEB':'var(--bg-main)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
              <div><span style={{fontWeight:700,fontSize:15}}>{a.title}</span> {a.priority === 'urgent' && <span style={{fontSize:10,color:'#fff',background:'#DC2626',padding:'1px 8px',borderRadius:8,marginLeft:6}}>URGENT</span>}</div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}><span className="badge pending" style={{fontSize:10}}>{a.category}</span><span style={{fontSize:11,color:'var(--text-muted)'}}>{a.creator?.name}</span></div>
            </div>
            <p style={{fontSize:13,whiteSpace:'pre-wrap',margin:'4px 0',color:'var(--text-secondary)'}}>{a.content}</p>
            <div style={{display:'flex',gap:12,alignItems:'center',marginTop:6}}>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>{new Date(a.createdAt).toLocaleDateString()}</span>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>{a.readCount} read</span>
              {!a.isRead && <button className="btn btn-secondary" style={{padding:'2px 8px',fontSize:11}} onClick={async()=>{await api(`/api/hr/announcements/${a.id}/read`,'PUT');fetchAll();}}>Mark Read</button>}
            </div>
          </div>
        )).reverse()}</div>
      </Section>
    </div>
  );

  // ─── POLICIES ───────────────────────────────
  if (tab === 'policies') return (
    <div className="view-section active">
      <Section title="Policies & Compliance" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setShowForm('policy')}><Plus size={12} /> New Policy</button>}>
        {showForm === 'policy' && <ModalForm fields={[{key:'title',label:'Title',required:true},{key:'category',label:'Category',type:'select',options:['hr','finance','it','admin','compliance','code_of_conduct','other']},{key:'content',label:'Content',type:'textarea'},{key:'version',label:'Version',placeholder:'1.0'},{key:'effectiveDate',label:'Effective Date',type:'date'}]} onSave={async d=>{const r=await api('/api/hr/policies','POST',d);if(r){showToast('Policy created');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)} />}
        <div style={{display:'grid',gap:14}}>{(policies||[]).map(p => (
          <div key={p.id} style={{padding:16,borderRadius:10,border:'1px solid var(--border-color)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <div><span style={{fontWeight:700,fontSize:15}}>{p.title}</span> <span className="badge good" style={{fontSize:10,marginLeft:8}}>v{p.version||'1.0'}</span></div>
              <span className="badge pending" style={{fontSize:10}}>{p.category}</span>
            </div>
            <p style={{fontSize:13,color:'var(--text-secondary)',margin:'4px 0',whiteSpace:'pre-wrap'}}>{p.content?.slice(0,300)}</p>
            <div style={{display:'flex',gap:10,alignItems:'center',marginTop:6,fontSize:11,color:'var(--text-muted)'}}>
              <span>Effective: {p.effectiveDate||'-'}</span>
              {p.requiresAcknowledgment && <button className="btn btn-secondary" style={{padding:'2px 10px',fontSize:11}} onClick={async()=>{await api(`/api/hr/policies/${p.id}/acknowledge`,'PUT');showToast('Acknowledged');}}><Check size={11}/> Acknowledge</button>}
            </div>
          </div>
        ))}</div>
      </Section>
    </div>
  );

  // ─── DOCUMENTS (non-HR view) ────────────────
  if (!isHR && !['overview','documents','announcements','policies'].includes(tab)) {
    return <div className="view-section active" style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>You do not have access to this section.</div>;
  }

  // ─── EMPLOYEES ──────────────────────────────
  if (tab === 'employees') return (
    <div className="view-section active">
      <Section title="Employee Profiles" action={<div><input className="table-input" placeholder="Search..." style={{width:200}} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>}>
        {profiles.length === 0 && <p style={{textAlign:'center',padding:24,color:'var(--text-muted)'}}>No extended profiles found. HR can add department, designation, and other details.</p>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Designation</th><th>Reporting</th><th>Type</th><th>Probation</th><th style={{width:60}}></th></tr></thead>
          <tbody>{(profiles||[]).filter(p => !searchTerm || p.users?.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
            <tr key={p.id}><td style={{fontWeight:600}}>{p.users?.name}<br/><span style={{fontSize:11,color:'var(--text-muted)'}}>{p.users?.email}</span></td>
              <td style={{fontSize:12}}>{p.users?.role}</td><td style={{fontSize:12}}>{p.department||'-'}</td><td style={{fontSize:12}}>{p.designation||'-'}</td>
              <td style={{fontSize:12}}>{empName(p.reportingManagerId)}</td><td style={{fontSize:12}}>{p.employmentType||'-'}</td><td style={{fontSize:12}}>{p.probationEndDate||'-'}</td>
              <td>{isHR && <button className="btn btn-secondary" style={{padding:'2px 6px',fontSize:11}} onClick={() => setEditProfile(p)}><Edit3 size={11}/></button>}</td>
            </tr>
          ))}</tbody></table></div>
      </Section>
      {editProfile && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--bg-card)',borderRadius:12,padding:24,maxWidth:600,width:'92%',maxHeight:'85vh',overflow:'auto'}}>
            <h3 style={{marginBottom:16,fontSize:16}}>Edit: {editProfile.users?.name}</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['department','Department'],['designation','Designation'],['workLocation','Location'],['employmentType','Type',['Full-time','Part-time','Contract','Intern','Temporary']],['probationEndDate','Probation End','date'],['noticePeriodDays','Notice Period (days)','number'],['emergencyContactName','Emergency Contact'],['emergencyContactPhone','Phone'],['emergencyContactRelation','Relation'],['bankName','Bank Name'],['bankAccountNumber','A/C No'],['bankIfscCode','IFSC'],['panNumber','PAN'],['uanNumber','UAN'],['skills','Skills (comma-sep)'],['certifications','Certifications']].map(([k, lbl, type]) => (
                <div key={k} style={{marginBottom:4}}>
                  <label style={{fontSize:11,fontWeight:600}}>{lbl}</label>
                  {type === 'date' ? <input className="table-input" type="date" value={editProfile[k]||''} onChange={e=>setEditProfile({...editProfile,[k]:e.target.value})} />
                   : type === 'number' ? <input className="table-input" type="number" value={editProfile[k]||''} onChange={e=>setEditProfile({...editProfile,[k]:Number(e.target.value)})} />
                   : Array.isArray(type) ? <select className="table-select" value={editProfile[k]||''} onChange={e=>setEditProfile({...editProfile,[k]:e.target.value})}><option value="">Select</option>{type.map(t=><option key={t} value={t}>{t}</option>)}</select>
                   : <input className="table-input" value={editProfile[k]||''} onChange={e=>setEditProfile({...editProfile,[k]:e.target.value})} />}
                </div>
              ))}
              <div style={{marginBottom:4}}><label style={{fontSize:11,fontWeight:600}}>Reporting Manager</label>
                <select className="table-select" value={editProfile.reportingManagerId||''} onChange={e=>setEditProfile({...editProfile,reportingManagerId:e.target.value?Number(e.target.value):null})}>
                  <option value="">None</option>{empOpts().map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:20}}>
              <button className="btn btn-primary" style={{padding:'8px 24px'}} onClick={async()=>{
                const r=await api(`/api/hr/employee-ext/${editProfile.userId}`,'PUT',editProfile);
                if(r){showToast('Profile updated');setEditProfile(null);fetchAll();}
              }}><Save size={14}/> Save</button>
              <button className="btn btn-secondary" style={{padding:'8px 24px'}} onClick={()=>setEditProfile(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── PERFORMANCE ────────────────────────────
  if (tab === 'performance') return (
    <div className="view-section active">
      <Section title="Performance Reviews" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('review')}><Plus size={12}/> New</button>}>
        {showForm==='review'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'reviewTitle',label:'Title',required:true},{key:'reviewPeriod',label:'Period',type:'select',options:['monthly','quarterly','half_yearly','yearly','probation']},{key:'startDate',label:'Start',type:'date'},{key:'endDate',label:'End',type:'date'},{key:'managerId',label:'Manager',type:'select',options:leaderOpts()}]} onSave={async d=>{d.userId=Number(d.userId);if(d.managerId)d.managerId=Number(d.managerId);const r=await api('/api/hr/performance','POST',d);if(r){showToast('Review created');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Title</th><th>Period</th><th style={{width:60}}>Self</th><th style={{width:60}}>Mgr</th><th style={{width:60}}>Final</th><th style={{width:90}}>Status</th></tr></thead>
          <tbody>{reviews.map(r => <tr key={r.id}><td style={{fontWeight:600,fontSize:13}}>{r.user?.name}</td><td style={{fontSize:13}}>{r.reviewTitle}</td><td style={{fontSize:12}}>{r.reviewPeriod}</td><td>{r.selfRating||'-'}</td><td>{r.managerRating||'-'}</td><td style={{fontWeight:600}}>{r.finalRating||'-'}</td><td><Badge status={r.status}/></td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── GOALS ──────────────────────────────────
  if (tab === 'goals') return (
    <div className="view-section active">
      <Section title="Goals & OKRs" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('goal')}><Plus size={12}/> New</button>}>
        {showForm==='goal'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'title',label:'Title',required:true},{key:'goalType',label:'Type',type:'select',options:['goal','okr','kpi','project','development']},{key:'startDate',label:'Start',type:'date'},{key:'endDate',label:'Deadline',type:'date'}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/goals','POST',d);if(r){showToast('Goal created');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Title</th><th>Type</th><th style={{width:120}}>Progress</th><th>Deadline</th><th style={{width:90}}>Status</th></tr></thead>
          <tbody>{goals.map(g => <tr key={g.id}><td style={{fontWeight:600,fontSize:13}}>{g.user?.name}</td><td>{g.title}</td><td style={{fontSize:12}}>{g.goalType}</td>
            <td><div style={{display:'flex',alignItems:'center',gap:8}}><ProgressBar value={g.progress} w={80}/><span style={{fontSize:11,fontWeight:600}}>{g.progress}%</span></div></td>
            <td style={{fontSize:12}}>{g.endDate||'-'}</td><td><Badge status={g.status}/></td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── TRAINING ───────────────────────────────
  if (tab === 'training') return (
    <div className="view-section active">
      <Section title="Training & Certifications" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('training')}><Plus size={12}/> Assign</button>}>
        {showForm==='training'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'trainingName',label:'Name',required:true},{key:'trainingType',label:'Type',type:'select',options:['internal','external','online','certification']},{key:'provider',label:'Provider'},{key:'startDate',label:'Start',type:'date'},{key:'endDate',label:'End',type:'date'},{key:'expiryDate',label:'Cert Expiry',type:'date'}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/training','POST',d);if(r){showToast('Training assigned');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Training</th><th>Type</th><th style={{width:110}}>Progress</th><th style={{width:50}}>Score</th><th style={{width:90}}>Expiry</th><th style={{width:90}}>Status</th></tr></thead>
          <tbody>{training.map(t => {
            const expired = t.expiryDate && t.expiryDate < new Date().toISOString().split('T')[0];
            return <tr key={t.id}><td style={{fontWeight:600,fontSize:13}}>{t.user?.name}</td><td>{t.trainingName}</td><td style={{fontSize:12}}>{t.trainingType}</td>
              <td><div style={{display:'flex',alignItems:'center',gap:8}}><ProgressBar value={t.progress} w={70}/><span style={{fontSize:11}}>{t.progress}%</span></div></td>
              <td>{t.score||'-'}</td><td style={{fontSize:12,color:expired?'var(--danger)':'inherit'}}>{t.expiryDate||'-'}{expired&&' ⚠'}</td>
              <td><Badge status={t.status}/></td></tr>;
          })}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── SKILLS ─────────────────────────────────
  if (tab === 'skills') return (
    <div className="view-section active">
      <Section title="Skill Matrix" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('skill')}><Plus size={12}/> Add</button>}>
        {showForm==='skill'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'skill',label:'Skill',required:true},{key:'skillType',label:'Type',type:'select',options:['technical','soft','domain','language','certification']},{key:'proficiencyLevel',label:'Level (1-5)',type:'number'},{key:'yearsExperience',label:'Years Exp',type:'number'}]} onSave={async d=>{d.userId=Number(d.userId);d.proficiencyLevel=Number(d.proficiencyLevel)||1;d.yearsExperience=Number(d.yearsExperience)||0;const r=await api('/api/hr/skills','POST',d);if(r){showToast('Skill added');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Skill</th><th>Type</th><th style={{width:130}}>Proficiency</th><th>Exp</th></tr></thead>
          <tbody>{skills.map(s => <tr key={s.id}><td style={{fontWeight:600,fontSize:13}}>{s.user?.name}</td><td>{s.skill}</td><td style={{fontSize:12}}>{s.skillType}</td><td><Stars level={s.proficiencyLevel}/></td><td style={{fontSize:12}}>{s.yearsExperience}y</td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── ASSETS ─────────────────────────────────
  if (tab === 'assets') return (
    <div className="view-section active">
      <Section title="Employee Assets" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('asset')}><Plus size={12}/> Allocate</button>}>
        {showForm==='asset'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'assetType',label:'Type',type:'select',required:true,options:['laptop','desktop','monitor','mobile','sim_card','id_card','access_card','peripheral','software_license','other']},{key:'assetName',label:'Name',required:true},{key:'assetTag',label:'Tag'},{key:'serialNumber',label:'Serial'},{key:'model',label:'Model'},{key:'allocatedDate',label:'Date',type:'date',required:true},{key:'condition',label:'Condition',type:'select',options:['new','good','fair','damaged','lost']}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/assets','POST',d);if(r){showToast('Asset allocated');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Asset</th><th>Type</th><th>Serial</th><th>Allocated</th><th style={{width:80}}>Condition</th><th>Status</th><th style={{width:60}}></th></tr></thead>
          <tbody>{assets.map(a => <tr key={a.id}><td style={{fontWeight:600,fontSize:13}}>{a.user?.name}</td><td>{a.assetName}</td><td style={{fontSize:12}}>{a.assetType?.replace(/_/g,' ')}</td><td style={{fontSize:11}}>{a.serialNumber||'-'}</td><td style={{fontSize:12}}>{a.allocatedDate}</td><td><Badge status={a.condition}/></td><td><Badge status={a.status}/></td>
            <td>{isHR && a.status==='allocated' && <button className="btn btn-secondary" style={{padding:'2px 6px',fontSize:11}} onClick={async()=>{await api(`/api/hr/assets/${a.id}/return`,'PUT');fetchAll();showToast('Returned');}} title="Return"><LogOut size={11}/></button>}</td>
          </tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── ONBOARDING ─────────────────────────────
  if (tab === 'onboarding') return (
    <div className="view-section active">
      <Section title="Onboarding Tracker" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('onboarding')}><Plus size={12}/> Start</button>}>
        {showForm==='onboarding'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'joiningDate',label:'Joining Date',type:'date'},{key:'reportingManagerId',label:'Manager',type:'select',options:leaderOpts()}]} onSave={async d=>{d.userId=Number(d.userId);if(d.reportingManagerId)d.reportingManagerId=Number(d.reportingManagerId);const r=await api('/api/hr/onboarding','POST',{...d,tasks:[{task:'Document Collection',category:'documentation'},{task:'Account Creation',category:'accounts'},{task:'Asset Allocation',category:'assets'},{task:'Induction Session',category:'induction'},{task:'Training',category:'training'},{task:'IT Setup',category:'it_setup'}]});if(r){showToast('Onboarding started');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div style={{display:'grid',gap:14}}>{(onboarding||[]).map(o => {
          const tasks = o.tasks||[];
          const done = tasks.filter(t => t.status === 'completed').length;
          return <div key={o.id} style={{padding:16,borderRadius:10,border:'1px solid var(--border-color)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,marginBottom:10}}>
              <div><strong style={{fontSize:15}}>{o.user?.name}</strong> <span style={{fontSize:12,color:'var(--text-muted)',marginLeft:8}}>Joining: {o.joiningDate||'TBD'}</span></div>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <span style={{fontSize:12,fontWeight:600}}>{done}/{tasks.length}</span>
                <ProgressBar value={tasks.length?(done/tasks.length*100):0} w={100}/>
                <Badge status={o.status}/>
              </div>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{tasks.map(t => (
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,padding:'4px 10px',borderRadius:6,background:t.status==='completed'?'#DCFCE7':t.status==='in_progress'?'#FEF9C3':'#F3F4F6'}}>
                {t.status==='completed'?<Check size={12} style={{color:'#16A34A'}}/>:<div style={{width:8,height:8,borderRadius:'50%',background:'var(--border-color)'}}/>}
                {t.task}
                {isHR && t.status !== 'completed' && <button className="btn btn-secondary" style={{padding:'1px 5px',fontSize:10,marginLeft:4}} onClick={async()=>{await api(`/api/hr/onboarding-tasks/${t.id}`,'PUT',{status:'completed'});fetchAll();}}><Check size={10}/></button>}
              </div>
            ))}</div>
          </div>;
        })}</div>
      </Section>
    </div>
  );

  // ─── DISCIPLINARY ───────────────────────────
  if (tab === 'disciplinary') return (
    <div className="view-section active">
      <Section title="Disciplinary Actions" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('disciplinary')}><Plus size={12}/> New</button>}>
        {showForm==='disciplinary'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'actionType',label:'Type',type:'select',required:true,options:['verbal_warning','written_warning','final_warning','show_cause','suspension','investigation','improvement_plan','termination','other']},{key:'title',label:'Title',required:true},{key:'description',label:'Description',type:'textarea'},{key:'issuedDate',label:'Date',type:'date',required:true},{key:'effectiveDate',label:'Effective',type:'date'}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/disciplinary','POST',d);if(r){showToast('Action recorded');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Type</th><th>Title</th><th>Date</th><th>Issued By</th><th style={{width:90}}>Status</th></tr></thead>
          <tbody>{disciplinary.map(d => <tr key={d.id}><td style={{fontWeight:600,fontSize:13}}>{d.user?.name}</td><td style={{fontSize:12}}>{d.actionType?.replace(/_/g,' ')}</td><td>{d.title}</td><td style={{fontSize:12}}>{d.issuedDate}</td><td style={{fontSize:12}}>{d.issuer?.name||'-'}</td><td><Badge status={d.status}/></td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── EXIT ───────────────────────────────────
  if (tab === 'exit') return (
    <div className="view-section active">
      <Section title="Exit Management" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('exit')}><Plus size={12}/> Record</button>}>
        {showForm==='exit'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'resignationDate',label:'Resignation Date',type:'date',required:true},{key:'lastWorkingDay',label:'Last Working Day',type:'date'},{key:'noticePeriodDays',label:'Notice Period',type:'number'},{key:'reason',label:'Reason',type:'textarea'}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/exit','POST',d);if(r){showToast('Exit recorded');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Resigned</th><th>Last Day</th><th>Clearance</th><th>Settlement</th><th>Exp Letter</th><th>Status</th></tr></thead>
          <tbody>{exits.map(e => <tr key={e.id}><td style={{fontWeight:600,fontSize:13}}>{e.user?.name}</td><td style={{fontSize:12}}>{e.resignationDate}</td><td style={{fontSize:12}}>{e.lastWorkingDay||'-'}</td>
            <td><Badge status={e.clearanceStatus}/></td><td style={{fontSize:12}}>{e.settlementDate||'-'}</td>
            <td style={{textAlign:'center'}}>{e.experienceLetterIssued?<Check size={14} style={{color:'#16A34A'}}/>:<X size={14} style={{color:'#DC2626'}}/>}</td>
            <td><Badge status={e.status}/></td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── PROMOTIONS ─────────────────────────────
  if (tab === 'promotions') return (
    <div className="view-section active">
      <Section title="Promotions & Transfers" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('promotion')}><Plus size={12}/> New</button>}>
        {showForm==='promotion'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'promotionType',label:'Type',type:'select',required:true,options:['promotion','transfer','designation_change','salary_revision']},{key:'newDesignation',label:'New Designation'},{key:'newDepartment',label:'New Department'},{key:'newSalary',label:'New Salary',type:'number'},{key:'effectiveDate',label:'Effective',type:'date',required:true},{key:'reason',label:'Reason'}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/promotions','POST',d);if(r){showToast('Recorded');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Type</th><th>New Role</th><th>New Dept</th><th>Effective</th><th style={{width:90}}>Status</th></tr></thead>
          <tbody>{promotions.map(p => <tr key={p.id}><td style={{fontWeight:600,fontSize:13}}>{p.user?.name}</td><td style={{fontSize:12}}>{p.promotionType?.replace(/_/g,' ')}</td><td style={{fontSize:12}}>{p.newDesignation||'-'}</td><td style={{fontSize:12}}>{p.newDepartment||'-'}</td><td style={{fontSize:12}}>{p.effectiveDate}</td><td><Badge status={p.status}/></td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── PROBATION ──────────────────────────────
  if (tab === 'probation') return (
    <div className="view-section active">
      <Section title="Probation Management" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('probation')}><Plus size={12}/> New</button>}>
        {showForm==='probation'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'startDate',label:'Start Date',type:'date',required:true},{key:'endDate',label:'End Date',type:'date',required:true},{key:'probationPeriod',label:'Period (months)',type:'number'}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/probation','POST',d);if(r){showToast('Record created');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Start</th><th>End</th><th>Extension</th><th style={{width:90}}>Status</th><th></th></tr></thead>
          <tbody>{probation.map(p => <tr key={p.id}><td style={{fontWeight:600,fontSize:13}}>{p.user?.name}</td><td style={{fontSize:12}}>{p.probationPeriod}m</td><td style={{fontSize:12}}>{p.startDate}</td><td style={{fontSize:12}}>{p.endDate}</td><td style={{fontSize:12}}>{p.extensionMonths?`+${p.extensionMonths}m`:'-'}</td>
            <td><Badge status={p.reviewStatus} map={{ongoing:'pending',extended:'average',confirmed:'excellent',terminated:'high'}}/></td>
            <td>{isHR && p.reviewStatus==='ongoing' && <button className="btn btn-primary" style={{padding:'3px 8px',fontSize:11}} onClick={async()=>{await api(`/api/hr/probation/${p.id}`,'PUT',{reviewStatus:'confirmed'});fetchAll();showToast('Confirmed');}}><Check size={11}/> Confirm</button>}</td>
          </tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── RECOGNITION ────────────────────────────
  if (tab === 'recognition') return (
    <div className="view-section active">
      <Section title="Employee Recognition" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('recognition')}><Plus size={12}/> Award</button>}>
        {showForm==='recognition'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'recognitionType',label:'Type',type:'select',required:true,options:['employee_of_month','employee_of_quarter','appreciation','achievement','award','certificate','milestone','spot_bonus','other']},{key:'title',label:'Title',required:true},{key:'description',label:'Description',type:'textarea'},{key:'awardedDate',label:'Date',type:'date',required:true},{key:'incentiveAmount',label:'Incentive $',type:'number'}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/recognition','POST',d);if(r){showToast('Recognition recorded');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Type</th><th>Title</th><th>Date</th><th>Awarded By</th><th>Incentive</th></tr></thead>
          <tbody>{recognitions.map(r => <tr key={r.id}><td style={{fontWeight:600,fontSize:13}}>{r.user?.name}</td><td style={{fontSize:12}}>{r.recognitionType?.replace(/_/g,' ')}</td><td>{r.title}</td><td style={{fontSize:12}}>{r.awardedDate}</td><td style={{fontSize:12}}>{r.awarder?.name||'-'}</td><td>{r.incentiveAmount?`$${r.incentiveAmount}`:'-'}</td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── SURVEYS ────────────────────────────────
  if (tab === 'surveys') return (
    <div className="view-section active">
      <Section title="Employee Surveys" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('survey')}><Plus size={12}/> New</button>}>
        {showForm==='survey'&&<ModalForm fields={[{key:'title',label:'Title',required:true},{key:'description',label:'Description',type:'textarea'},{key:'surveyType',label:'Type',type:'select',options:['engagement','pulse','feedback','satisfaction','exit','training','other']},{key:'startDate',label:'Start',type:'date'},{key:'endDate',label:'End',type:'date'},{key:'anonymous',label:'Anonymous',type:'select',options:[{value:true,label:'Yes'},{value:false,label:'No'}]}]} onSave={async d=>{const r=await api('/api/hr/surveys','POST',d);if(r){showToast('Survey created');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Title</th><th>Type</th><th>Period</th><th>Anonymous</th><th style={{width:90}}>Status</th></tr></thead>
          <tbody>{surveys.map(s => <tr key={s.id}><td style={{fontWeight:600}}>{s.title}</td><td style={{fontSize:12}}>{s.surveyType}</td><td style={{fontSize:12}}>{s.startDate} &rarr; {s.endDate||'-'}</td>
            <td style={{textAlign:'center'}}>{s.anonymous?<Check size={14} style={{color:'#16A34A'}}/>:<X size={14} style={{color:'#DC2626'}}/>}</td>
            <td><Badge status={s.status}/></td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── ANALYTICS ──────────────────────────────
  if (tab === 'analytics') return (
    <div className="view-section active">
      <div className="dashboard-grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))',gap:12,marginBottom:20}}>
        <Card label="Total" value={analytics.totalEmployees||0} color="#2563EB" />
        <Card label="Active" value={analytics.activeEmployees||0} color="#16A34A" />
        <Card label="Attrition" value={`${analytics.attritionRate||0}%`} color={(analytics.attritionRate||0)>20?'#DC2626':'#16A34A'} />
      </div>
      <Section title="Department Headcount">
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{Object.entries(analytics.departmentHeadcount||{}).map(([dept,count]) => (
          <div key={dept} style={{padding:'10px 20px',borderRadius:8,border:'1px solid var(--border-color)',textAlign:'center',minWidth:120,background:'var(--bg-main)'}}>
            <div style={{fontWeight:700,fontSize:24,color:'var(--text-primary)'}}>{count}</div>
            <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'capitalize'}}>{dept}</div>
          </div>
        ))}</div>
      </Section>
      <Section title="Recruitment Pipeline">
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{Object.entries(analytics.recruitmentPipeline||{}).map(([s,c]) => (
          <div key={s} style={{padding:'10px 20px',borderRadius:8,border:'1px solid var(--border-color)',textAlign:'center',minWidth:110,background:'var(--bg-main)'}}>
            <div style={{fontWeight:700,fontSize:24,color:'var(--text-primary)'}}>{c}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>{s.replace(/_/g,' ')}</div>
          </div>
        ))}</div>
      </Section>
    </div>
  );

  // ─── AUDIT LOG ──────────────────────────────
  if (tab === 'audit-log') return (
    <div className="view-section active">
      <Section title="Audit Log">
        <div className="table-responsive" style={{maxHeight:550,overflow:'auto'}}>
          <table className="data-table"><thead><tr><th style={{width:160}}>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
            <tbody>{logs.length === 0 ? <tr><td colSpan={5} style={{textAlign:'center',padding:24,color:'var(--text-muted)'}}>No audit records yet.</td></tr> : logs.slice(0,200).map(l => (
              <tr key={l.id}><td style={{fontSize:11,whiteSpace:'nowrap'}}>{l.createdAt}</td><td style={{fontSize:12}}>{l.user?.name||'-'}</td><td style={{fontSize:12}}>{l.action}</td><td style={{fontSize:12}}>{l.entity}</td><td style={{fontSize:11,color:'var(--text-muted)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{l.details?.slice(0,100)}</td></tr>
            ))}</tbody></table>
        </div>
      </Section>
    </div>
  );

  return <div className="view-section active" style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>Select a section from the sidebar.</div>;
};

export default HrDesk;
