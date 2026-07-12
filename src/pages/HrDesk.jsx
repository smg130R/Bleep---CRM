import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, Users, Briefcase, UserPlus, FileText, TrendingUp,
  BookOpen, Monitor, Clock, AlertTriangle, LogOut, ArrowUpDown,
  Award, Megaphone, Shield, BarChart3, ClipboardList, Search,
  Plus, Check, X, Edit3, Trash2, Save, Loader, ChevronDown, ChevronUp, ExternalLink,
  Gift, Bell, Star, List, Target, MessageSquare, Heart, Settings
} from 'lucide-react';

const HR_ROLES = ['admin', 'hr'];

const HrDesk = ({ showToast }) => {
  const { user } = useAuth();
  const isHR = HR_ROLES.includes(user?.role);

  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [overview, setOverview] = useState({});
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [plannerForm, setPlannerForm] = useState({ title: '', eventType: 'meeting', startDate: '', startTime: '09:00', participantIds: [] });
  const [showPlannerForm, setShowPlannerForm] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [editProfile, setEditProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docForm, setDocForm] = useState({ userId: '', documentType: '', documentName: '', fileUrl: '', issueDate: '', expiryDate: '' });
  const [showDocForm, setShowDocForm] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [onboarding, setOnboarding] = useState([]);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
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
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [showSurveyForm, setShowSurveyForm] = useState(false);
  const [showRecognitionForm, setShowRecognitionForm] = useState(false);
  const [showDisciplinaryForm, setShowDisciplinaryForm] = useState(false);
  const [showExitForm, setShowExitForm] = useState(false);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [showProbationForm, setShowProbationForm] = useState(false);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [filterUserId, setFilterUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const endpoints = [
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
      const results = await Promise.all(endpoints);
      setOverview(results[0]); setNotices(results[1].notices);
      setEvents(results[2].events); setProfiles(results[3].profiles);
      setDocuments(results[4].documents); setJobs(results[5].jobs);
      setCandidates(results[6].candidates); setInterviews(results[7].interviews);
      setOnboarding(results[8].onboarding); setReviews(results[9].reviews);
      setGoals(results[10].goals); setTraining(results[11].training);
      setSkills(results[12].skills); setAssets(results[13].assets);
      setDisciplinary(results[14].actions); setExits(results[15].exits);
      setPromotions(results[16].promotions); setProbation(results[17].probation);
      setAttendance(results[18].attendance); setAnnouncements(results[19].announcements);
      setRecognitions(results[20].recognitions); setPolicies(results[21].policies);
      setSurveys(results[22].surveys); setAnalytics(results[23]);
      setLogs(results[24].logs); setEmployees(results[25].employees || []);
    } catch (err) { console.error('HR fetch error:', err); }
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

  const s = (v) => v || 0;
  const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'planner', label: 'Planner', icon: Calendar, hrOnly: true },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'recruitment', label: 'Recruitment', icon: Briefcase, hrOnly: true },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, hrOnly: true },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'training', label: 'Training', icon: BookOpen },
    { id: 'skills', label: 'Skills', icon: Star },
    { id: 'assets', label: 'Assets', icon: Monitor, hrOnly: true },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'disciplinary', label: 'Discipline', icon: AlertTriangle, hrOnly: true },
    { id: 'exit', label: 'Exit', icon: LogOut, hrOnly: true },
    { id: 'promotions', label: 'Promotions', icon: ArrowUpDown, hrOnly: true },
    { id: 'probation', label: 'Probation', icon: ClipboardList, hrOnly: true },
    { id: 'recognition', label: 'Recognition', icon: Award },
    { id: 'announcements', label: 'Announce', icon: Megaphone },
    { id: 'policies', label: 'Policies', icon: Shield },
    { id: 'surveys', label: 'Surveys', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, hrOnly: true },
    { id: 'audit-log', label: 'Audit Log', icon: List, hrOnly: true },
  ];

  if (loading) return <div className="view-section active" style={{ textAlign: 'center', padding: '3rem' }}><Loader className="animate-spin" size={24} /><p>Loading HR module...</p></div>;

  const TabNav = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
      {tabs.filter(t => !t.hrOnly || isHR).map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 6, cursor: 'pointer',
            background: tab === t.id ? 'var(--primary-navy)' : 'transparent', color: tab === t.id ? '#fff' : 'var(--text-muted)' }}>
          <t.icon size={14} style={{ marginRight: 4, display: 'inline' }} />{t.label}
        </button>
      ))}
    </div>
  );

  const Section = ({ title, children, action }) => (
    <div className="content-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 8, marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );

  const empName = (uid) => employees.find(e => e.id === uid)?.name || `User #${uid}`;
  const allEmpOptions = () => employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.name} ({e.email})</option>);

  // ─── OVERVIEW ─────────────────────────────
  const renderOverview = () => (
    <>
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Employees', value: overview.totalEmployees, color: '#2563EB' },
          { label: 'Active', value: overview.activeEmployees, color: '#16A34A' },
          { label: 'Suspended', value: overview.suspendedEmployees, color: '#DC2626' },
          { label: 'On Leave', value: overview.employeesOnLeave, color: '#F59E0B' },
          { label: 'New Joiners (30d)', value: overview.newJoiners, color: '#8B5CF6' },
          { label: 'In Probation', value: overview.inProbation, color: '#EC4899' },
          { label: 'Notice Period', value: overview.inNoticePeriod, color: '#F97316' },
          { label: 'Resignations', value: overview.recentResignations, color: '#EF4444' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ borderLeft: `4px solid ${k.color}`, padding: '12px 16px' }}>
            <div className="kpi-card-title" style={{ fontSize: 11 }}>{k.label}</div>
            <div className="kpi-card-value" style={{ fontSize: 24 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Section title="Upcoming Notices & Reminders">
          {notices.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No upcoming notices.</p> : (
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {notices.slice(0, 30).map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: 12 }}>
                  <span style={{ color: n.priority === 'urgent' ? '#DC2626' : n.priority === 'high' ? '#F59E0B' : '#6B7280', flexShrink: 0 }}>
                    {n.type === 'birthday' ? <Gift size={14} /> : n.type === 'probation_end' ? <ClipboardList size={14} /> :
                     n.type === 'document_expiry' ? <FileText size={14} /> : n.type === 'event' ? <Calendar size={14} /> :
                     n.type === 'exit' ? <LogOut size={14} /> : n.type === 'review' ? <TrendingUp size={14} /> : <Bell size={14} />}
                  </span>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{n.title}</div><div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{n.date}</div></div>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: n.priority === 'urgent' ? '#FEE2E2' : n.priority === 'high' ? '#FEF3C7' : '#F3F4F6', color: n.priority === 'urgent' ? '#DC2626' : n.priority === 'high' ? '#92400E' : '#6B7280' }}>
                    {n.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Today's Events" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowPlannerForm(true)}><Plus size={12} /> Add</button>}>
          {events.filter(e => e.startDate === new Date().toISOString().split('T')[0] || e.status === 'scheduled').slice(0, 10).length === 0 ?
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No events today.</p> : (
            events.filter(e => e.startDate === new Date().toISOString().split('T')[0] || e.status === 'scheduled').slice(0, 10).map(e => (
              <div key={e.id} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border-color)', fontSize: 12 }}>
                <Calendar size={14} style={{ color: '#2563EB', flexShrink: 0 }} />
                <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{e.title}</div><div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{e.startDate} {e.startTime} - {e.eventType}</div></div>
              </div>
            ))
          )}
        </Section>
      </div>
    </>
  );

  // ─── PLANNER ──────────────────────────────
  const renderPlanner = () => (
    <Section title="HR Planner" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowPlannerForm(true)}><Plus size={12} /> New Event</button>}>
      {showPlannerForm && (
        <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-main)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>New Event</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input className="table-input" placeholder="Title" value={plannerForm.title} onChange={e => setPlannerForm({...plannerForm, title: e.target.value})} />
            <select className="table-select" value={plannerForm.eventType} onChange={e => setPlannerForm({...plannerForm, eventType: e.target.value})}>
              {['meeting','one_on_one','performance_review','interview','induction','training','team_meeting','disciplinary','exit_interview','recruitment','onboarding','joining','probation_review','appraisal','company_event','reminder'].map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
            <input className="table-input" type="date" value={plannerForm.startDate} onChange={e => setPlannerForm({...plannerForm, startDate: e.target.value})} />
            <input className="table-input" type="time" value={plannerForm.startTime} onChange={e => setPlannerForm({...plannerForm, startTime: e.target.value})} />
            <select className="table-select" multiple style={{ gridColumn: 'span 2', minHeight: 80 }} value={plannerForm.participantIds} onChange={e => setPlannerForm({...plannerForm, participantIds: [...e.target.selectedOptions].map(o => Number(o.value))})}>
              {allEmpOptions()}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 12 }} onClick={async () => {
              const res = await api('/api/hr/planner', 'POST', plannerForm);
              if (res) { showToast('Event created'); setShowPlannerForm(false); setPlannerForm({ title: '', eventType: 'meeting', startDate: '', startTime: '09:00', participantIds: [] }); fetchAll(); }
            }}><Save size={12} /> Save</button>
            <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: 12 }} onClick={() => setShowPlannerForm(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        {['scheduled','completed','cancelled'].map(s => (
          <button key={s} onClick={() => {}} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>{s}</button>
        ))}
      </div>
      <div className="table-responsive" style={{ maxHeight: 500, overflow: 'auto' }}>
        <table className="data-table"><thead><tr><th>Date</th><th>Time</th><th>Title</th><th>Type</th><th>Status</th><th>Participants</th></tr></thead>
          <tbody>{events.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)' }}>No events.</td></tr> : events.map(e => (
            <tr key={e.id}><td style={{ fontSize: 12 }}>{e.startDate}</td><td style={{ fontSize: 12 }}>{e.startTime}</td><td style={{ fontWeight: 600 }}>{e.title}</td><td style={{ fontSize: 12 }}>{e.eventType.replace(/_/g,' ')}</td>
              <td><span className={`badge ${e.status === 'completed' ? 'excellent' : e.status === 'cancelled' ? 'high' : 'pending'}`}>{e.status}</span></td>
              <td style={{ fontSize: 12 }}>{(e.participants||[]).map(p => p.user?.name).filter(Boolean).join(', ') || '-'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Section>
  );

  // ─── EMPLOYEES ────────────────────────────
  const renderEmployees = () => (
    <Section title="Employee Profiles" action={isHR && <div style={{ display: 'flex', gap: 8 }}><input className="table-input" placeholder="Search..." style={{ width: 200 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>}>
      <div className="table-responsive">
        <table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Designation</th><th>Reporting Mgr</th><th>Employment Type</th><th>Probation End</th><th>Actions</th></tr></thead>
          <tbody>{(profiles||[]).filter(p => !searchTerm || p.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)' }}>No profiles.</td></tr> : (profiles||[]).filter(p => !searchTerm || p.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
            <tr key={p.id}><td style={{ fontWeight: 600 }}>{p.users?.name}</td><td style={{ fontSize: 12 }}>{p.users?.email}</td><td>{p.users?.role}</td><td style={{ fontSize: 12 }}>{p.department || '-'}</td><td style={{ fontSize: 12 }}>{p.designation || '-'}</td>
              <td style={{ fontSize: 12 }}>{empName(p.reportingManagerId)}</td><td style={{ fontSize: 12 }}>{p.employmentType || '-'}</td><td style={{ fontSize: 12 }}>{p.probationEndDate || '-'}</td>
              <td>{isHR && <button className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => setEditProfile(p)}><Edit3 size={11} /></button>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {editProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, maxWidth: 600, width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ marginBottom: 12 }}>Edit Profile: {editProfile.users?.name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['department','Department'],['designation','Designation'],['employmentType','Employment Type'],
                ['workLocation','Work Location'],['probationEndDate','Probation End'],['noticePeriodDays','Notice Period (days)'],
                ['emergencyContactName','Emergency Contact'],['emergencyContactPhone','Emergency Phone'],
                ['emergencyContactRelation','Relation'],['bankName','Bank Name'],
                ['bankAccountNumber','Bank A/C'],['bankIfscCode','IFSC Code'],
                ['panNumber','PAN Number'],['uanNumber','UAN Number'],
                ['skills','Skills (comma-sep)'],['certifications','Certifications'],
              ].map(([field, label]) => (
                <div key={field} className="input-group" style={{ marginBottom: 4 }}>
                  <label style={{ fontSize: 11 }}>{label}</label>
                  {field === 'employmentType' ? (
                    <select className="table-select" value={editProfile[field] || ''} onChange={e => setEditProfile({...editProfile, [field]: e.target.value})}>
                      <option value="">Select</option>
                      {['Full-time','Part-time','Contract','Intern','Temporary'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : field === 'probationEndDate' || field === 'reportingManagerId' ? null : (
                    <input className="table-input" value={editProfile[field] || ''} onChange={e => setEditProfile({...editProfile, [field]: e.target.value})} />
                  )}
                </div>
              ))}
              <div className="input-group" style={{ marginBottom: 4 }}>
                <label style={{ fontSize: 11 }}>Reporting Manager</label>
                <select className="table-select" value={editProfile.reportingManagerId || ''} onChange={e => setEditProfile({...editProfile, reportingManagerId: e.target.value ? Number(e.target.value) : null})}>
                  <option value="">None</option>
                  {allEmpOptions()}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ padding: '8px 20px' }} onClick={async () => {
                const res = await api(`/api/hr/employee-ext/${editProfile.userId}`, 'PUT', editProfile);
                if (res) { showToast('Profile updated'); setEditProfile(null); fetchAll(); }
              }}><Save size={14} /> Save</button>
              <button className="btn btn-secondary" style={{ padding: '8px 20px' }} onClick={() => setEditProfile(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );

  // ─── RECRUITMENT ──────────────────────────
  const renderRecruitment = () => (
    <>
      <Section title="Job Openings" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowJobForm(true)}><Plus size={12} /> New Job</button>}>
        {showJobForm && <QuickForm fields={['title','department','location','employmentType','minExperience','maxExperience','openings','description','requirements']} labels={{title:'Title',department:'Department',location:'Location',employmentType:'Type',minExperience:'Min Exp (yrs)',maxExperience:'Max Exp (yrs)',openings:'Openings',description:'Description',requirements:'Requirements'}} types={{minExperience:'number',maxExperience:'number',openings:'number'}} onSave={async d => { const r=await api('/api/hr/recruitment/jobs','POST',d); if(r){showToast('Job created');setShowJobForm(false);fetchAll();}} } onCancel={()=>setShowJobForm(false)} />}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Title</th><th>Department</th><th>Openings</th><th>Filled</th><th>Status</th></tr></thead>
          <tbody>{jobs.map(j => <tr key={j.id}><td style={{fontWeight:600}}>{j.title}</td><td style={{fontSize:12}}>{j.department}</td><td>{j.openings}</td><td>{j.filledCount}</td><td><span className={`badge ${j.status==='open'?'good':j.status==='closed'?'high':'pending'}`}>{j.status}</span></td></tr>)}</tbody></table></div>
      </Section>
      <Section title="Candidates" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowCandidateForm(true)}><Plus size={12} /> Add</button>}>
        {showCandidateForm && <QuickForm fields={['name','email','phone','jobId','currentCompany','currentDesignation','experienceYears','expectedSalary','status','source']} labels={{name:'Name *',email:'Email',phone:'Phone',jobId:'Job',currentCompany:'Current Company',currentDesignation:'Designation',experienceYears:'Experience (yrs)',expectedSalary:'Expected Salary',source:'Source',status:'Status'}} types={{experienceYears:'number',expectedSalary:'number',jobId:'select'}} selectOptions={{jobId:jobs.map(j=>({value:j.id,label:j.title})),status:['new','screened','shortlisted','interview_scheduled','interviewed','selected','offered','offer_accepted','joined','rejected','on_hold']}} onSave={async d => {d.jobId=Number(d.jobId);const r=await api('/api/hr/recruitment/candidates','POST',d);if(r){showToast('Candidate added');setShowCandidateForm(false);fetchAll();}} } onCancel={()=>setShowCandidateForm(false)} />}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Name</th><th>Job</th><th>Phone</th><th>Experience</th><th>Status</th><th>Applied</th></tr></thead>
          <tbody>{candidates.map(c => <tr key={c.id}><td style={{fontWeight:600}}>{c.name}</td><td style={{fontSize:12}}>{c.job?.title||'-'}</td><td>{c.phone}</td><td style={{fontSize:12}}>{c.experienceYears}yrs</td><td><span className={`badge ${c.status==='joined'||c.status==='offer_accepted'?'excellent':c.status==='rejected'||c.status==='offer_declined'?'high':'pending'}`}>{c.status}</span></td><td style={{fontSize:11}}>{c.appliedDate}</td></tr>)}</tbody></table></div>
      </Section>
      <Section title="Interview Schedule" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowInterviewForm(true)}><Plus size={12} /> Schedule</button>}>
        {showInterviewForm && <QuickForm fields={['candidateId','jobId','interviewType','interviewDate','interviewTime','mode','link']} labels={{candidateId:'Candidate *',jobId:'Job',interviewType:'Type',interviewDate:'Date *',interviewTime:'Time',mode:'Mode',link:'Link'}} types={{candidateId:'select',jobId:'select',interviewDate:'date',interviewTime:'time'}} selectOptions={{candidateId:candidates.map(c=>({value:c.id,label:c.name})),jobId:jobs.map(j=>({value:j.id,label:j.title})),interviewType:['Telephonic','Technical','HR','Managerial','Final','Group','Other'],mode:['in_person','video_call','telephonic']}} onSave={async d => {d.candidateId=Number(d.candidateId);if(d.jobId)d.jobId=Number(d.jobId);const r=await api('/api/hr/recruitment/interviews','POST',d);if(r){showToast('Interview scheduled');setShowInterviewForm(false);fetchAll();}} } onCancel={()=>setShowInterviewForm(false)} />}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Candidate</th><th>Job</th><th>Date</th><th>Type</th><th>Mode</th><th>Status</th><th>Rating</th></tr></thead>
          <tbody>{interviews.map(i => <tr key={i.id}><td style={{fontWeight:600}}>{i.candidate?.name}</td><td style={{fontSize:12}}>{i.job?.title||'-'}</td><td style={{fontSize:12}}>{i.interviewDate}</td><td style={{fontSize:12}}>{i.interviewType}</td><td style={{fontSize:12}}>{i.mode}</td><td><span className={`badge ${i.status==='completed'?'good':i.status==='cancelled'?'high':'pending'}`}>{i.status}</span></td><td>{i.rating||'-'}</td></tr>)}</tbody></table></div>
      </Section>
    </>
  );

  // ─── DOCUMENTS ────────────────────────────
  const renderDocuments = () => (
    <Section title="Employee Documents" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowDocForm(true)}><Plus size={12} /> Add</button>}>
      {showDocForm && <QuickForm fields={['userId','documentType','documentName','fileUrl','issueDate','expiryDate']} labels={{userId:'Employee *',documentType:'Type *',documentName:'Name *',fileUrl:'File URL',issueDate:'Issue Date',expiryDate:'Expiry Date'}} types={{userId:'select',issueDate:'date',expiryDate:'date'}} selectOptions={{userId:employees.filter(e=>e.status==='active').map(e=>({value:e.id,label:e.name})),documentType:['Aadhaar','PAN','Passport','Voter ID','Driving License','Educational Certificate','Experience Letter','Offer Letter','Appointment Letter','NDA','Contract','Bank Details','Tax Document','Emergency Contact','Other']}} onSave={async d => {d.userId=Number(d.userId);const r=await api('/api/hr/documents','POST',d);if(r){showToast('Document added');setShowDocForm(false);fetchAll();}} } onCancel={()=>setShowDocForm(false)} />}
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Document</th><th>Type</th><th>Expiry</th><th>Verification</th><th>Actions</th></tr></thead>
        <tbody>{documents.map(d => <tr key={d.id}><td style={{fontWeight:600,fontSize:12}}>{d.users?.name}</td><td>{d.documentName}</td><td style={{fontSize:12}}>{d.documentType}</td>
          <td style={{fontSize:12,color:d.expiryDate&&d.expiryDate<new Date().toISOString().split('T')[0]?'var(--danger)':'inherit'}}>{d.expiryDate||'-'}</td>
          <td><span className={`badge ${d.verificationStatus==='verified'?'excellent':d.verificationStatus==='rejected'?'high':'pending'}`}>{d.verificationStatus}</span></td>
          <td>{isHR && d.verificationStatus !== 'verified' && <button className="btn btn-primary" style={{padding:'2px 6px',fontSize:11}} onClick={async()=>{await api(`/api/hr/documents/${d.id}/verify`,'PUT',{verificationStatus:'verified'});fetchAll();showToast('Verified');}}><Check size={11}/></button>}</td>
        </tr>)}</tbody></table></div>
    </Section>
  );

  // ─── PERFORMANCE ──────────────────────────
  const renderPerformance = () => (
    <Section title="Performance Reviews" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowReviewForm(true)}><Plus size={12} /> New Review</button>}>
      {showReviewForm && <QuickForm fields={['userId','reviewTitle','reviewPeriod','startDate','endDate','managerId']} labels={{userId:'Employee *',reviewTitle:'Title *',reviewPeriod:'Period',startDate:'Start *',endDate:'End',managerId:'Manager'}} types={{userId:'select',managerId:'select',startDate:'date',endDate:'date'}} selectOptions={{userId:employees.map(e=>({value:e.id,label:e.name})),managerId:employees.filter(e=>['admin','hr','team_lead','ops_head'].includes(e.role)).map(e=>({value:e.id,label:e.name})),reviewPeriod:['quarterly','half_yearly','yearly','monthly','probation']}} onSave={async d => {d.userId=Number(d.userId);if(d.managerId)d.managerId=Number(d.managerId);const r=await api('/api/hr/performance','POST',d);if(r){showToast('Review created');setShowReviewForm(false);fetchAll();}} } onCancel={()=>setShowReviewForm(false)} />}
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Title</th><th>Period</th><th>Self Rating</th><th>Manager Rating</th><th>Final</th><th>Status</th></tr></thead>
        <tbody>{reviews.map(r => <tr key={r.id}><td style={{fontWeight:600,fontSize:12}}>{r.user?.name}</td><td style={{fontSize:12}}>{r.reviewTitle}</td><td style={{fontSize:11}}>{r.reviewPeriod}</td><td>{r.selfRating||'-'}</td><td>{r.managerRating||'-'}</td><td style={{fontWeight:600}}>{r.finalRating||'-'}</td>
          <td><span className={`badge ${r.status==='completed'?'excellent':r.status==='cancelled'?'high':'pending'}`}>{r.status}</span></td>
        </tr>)}</tbody></table></div>
    </Section>
  );

  // ─── GOALS ────────────────────────────────
  const renderGoals = () => (
    <Section title="Goals & OKRs" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowGoalForm(true)}><Plus size={12} /> New Goal</button>}>
      {showGoalForm && <QuickForm fields={['userId','title','goalType','startDate','endDate','description']} labels={{userId:'Employee *',title:'Title *',goalType:'Type',startDate:'Start',endDate:'End',description:'Description'}} types={{userId:'select',startDate:'date',endDate:'date'}} selectOptions={{userId:employees.map(e=>({value:e.id,label:e.name})),goalType:['goal','okr','kpi','project','development']}} onSave={async d => {d.userId=Number(d.userId);const r=await api('/api/hr/goals','POST',d);if(r){showToast('Goal created');setShowGoalForm(false);fetchAll();}} } onCancel={()=>setShowGoalForm(false)} />}
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Title</th><th>Type</th><th>Progress</th><th>Deadline</th><th>Status</th></tr></thead>
        <tbody>{goals.map(g => <tr key={g.id}><td style={{fontWeight:600,fontSize:12}}>{g.user?.name}</td><td>{g.title}</td><td style={{fontSize:12}}>{g.goalType}</td>
          <td><div style={{width:100,height:6,background:'var(--border-color)',borderRadius:3}}><div style={{width:`${g.progress}%`,height:6,background:g.progress>=80?'var(--success)':g.progress>=40?'var(--warning)':'var(--danger)',borderRadius:3}}/></div></td>
          <td style={{fontSize:12}}>{g.endDate||'-'}</td>
          <td><span className={`badge ${g.status==='completed'?'excellent':g.status==='active'?'good':'high'}`}>{g.status}</span></td>
        </tr>)}</tbody></table></div>
    </Section>
  );

  // ─── TRAINING ─────────────────────────────
  const renderTraining = () => (
    <Section title="Training" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowTrainingForm(true)}><Plus size={12} /> Assign</button>}>
      {showTrainingForm && <QuickForm fields={['userId','trainingName','trainingType','provider','startDate','endDate','expiryDate']} labels={{userId:'Employee *',trainingName:'Name *',trainingType:'Type',provider:'Provider',startDate:'Start',endDate:'End',expiryDate:'Cert Expiry'}} types={{userId:'select',startDate:'date',endDate:'date',expiryDate:'date'}} selectOptions={{userId:employees.map(e=>({value:e.id,label:e.name})),trainingType:['internal','external','online','certification']}} onSave={async d => {d.userId=Number(d.userId);const r=await api('/api/hr/training','POST',d);if(r){showToast('Training assigned');setShowTrainingForm(false);fetchAll();}} } onCancel={()=>setShowTrainingForm(false)} />}
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Training</th><th>Type</th><th>Progress</th><th>Score</th><th>Expiry</th><th>Status</th></tr></thead>
        <tbody>{training.map(t => <tr key={t.id}><td style={{fontWeight:600,fontSize:12}}>{t.user?.name}</td><td>{t.trainingName}</td><td style={{fontSize:12}}>{t.trainingType}</td>
          <td><div style={{width:80,height:6,background:'var(--border-color)',borderRadius:3}}><div style={{width:`${t.progress}%`,height:6,background:t.progress>=80?'var(--success)':'var(--warning)',borderRadius:3}}/></div></td>
          <td>{t.score||'-'}</td><td style={{fontSize:12,color:t.expiryDate&&t.expiryDate<new Date().toISOString().split('T')[0]?'var(--danger)':'inherit'}}>{t.expiryDate||'-'}</td>
          <td><span className={`badge ${t.status==='completed'?'excellent':t.status==='in_progress'?'good':'pending'}`}>{t.status}</span></td>
        </tr>)}</tbody></table></div>
    </Section>
  );

  // ─── SKILLS ───────────────────────────────
  const renderSkills = () => (
    <Section title="Skill Matrix" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowSkillForm(true)}><Plus size={12} /> Add Skill</button>}>
      {showSkillForm && <QuickForm fields={['userId','skill','skillType','proficiencyLevel','yearsExperience']} labels={{userId:'Employee *',skill:'Skill *',skillType:'Type',proficiencyLevel:'Level (1-5)',yearsExperience:'Years'}} types={{userId:'select',proficiencyLevel:'number',yearsExperience:'number'}} selectOptions={{userId:employees.map(e=>({value:e.id,label:e.name})),skillType:['technical','soft','domain','language','certification']}} onSave={async d => {d.userId=Number(d.userId);d.proficiencyLevel=Number(d.proficiencyLevel);d.yearsExperience=Number(d.yearsExperience)||0;const r=await api('/api/hr/skills','POST',d);if(r){showToast('Skill added');setShowSkillForm(false);fetchAll();}} } onCancel={()=>setShowSkillForm(false)} />}
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Skill</th><th>Type</th><th>Level</th><th>Experience</th></tr></thead>
        <tbody>{skills.map(s => <tr key={s.id}><td style={{fontWeight:600,fontSize:12}}>{s.user?.name}</td><td>{s.skill}</td><td style={{fontSize:12}}>{s.skillType}</td>
          <td><div style={{display:'flex',gap:2}}>{[1,2,3,4,5].map(i => <div key={i} style={{width:12,height:12,borderRadius:'50%',background:i<=s.proficiencyLevel?'var(--success)':'var(--border-color)'}}/>)}</div></td>
          <td style={{fontSize:12}}>{s.yearsExperience}yrs</td>
        </tr>)}</tbody></table></div>
    </Section>
  );

  // ─── ASSETS ───────────────────────────────
  const renderAssets = () => (
    <Section title="Employee Assets" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowAssetForm(true)}><Plus size={12} /> Allocate</button>}>
      {showAssetForm && <QuickForm fields={['userId','assetType','assetName','assetTag','serialNumber','model','allocatedDate','condition']} labels={{userId:'Employee *',assetType:'Type *',assetName:'Name *',assetTag:'Tag',serialNumber:'Serial',model:'Model',allocatedDate:'Date *',condition:'Condition'}} types={{userId:'select',allocatedDate:'date'}} selectOptions={{userId:employees.map(e=>({value:e.id,label:e.name})),assetType:['laptop','desktop','monitor','mobile','sim_card','id_card','access_card','peripheral','software_license','other'],condition:['new','good','fair','damaged','lost']}} onSave={async d => {d.userId=Number(d.userId);const r=await api('/api/hr/assets','POST',d);if(r){showToast('Asset allocated');setShowAssetForm(false);fetchAll();}} } onCancel={()=>setShowAssetForm(false)} />}
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Asset</th><th>Type</th><th>Serial</th><th>Allocated</th><th>Condition</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{assets.map(a => <tr key={a.id}><td style={{fontWeight:600,fontSize:12}}>{a.user?.name}</td><td>{a.assetName}</td><td style={{fontSize:12}}>{a.assetType}</td><td style={{fontSize:11}}>{a.serialNumber||'-'}</td>
          <td style={{fontSize:12}}>{a.allocatedDate}</td>
          <td><span className={`badge ${a.condition==='new'||a.condition==='good'?'good':a.condition==='fair'?'pending':'high'}`}>{a.condition}</span></td>
          <td><span className={`badge ${a.status==='allocated'?'good':'high'}`}>{a.status}</span></td>
          <td>{isHR && a.status==='allocated' && <button className="btn btn-secondary" style={{padding:'2px 6px',fontSize:11}} onClick={async()=>{await api(`/api/hr/assets/${a.id}/return`,'PUT');fetchAll();showToast('Returned');}}><LogOut size={11}/></button>}</td>
        </tr>)}</tbody></table></div>
    </Section>
  );

  // ─── ATTENDANCE ───────────────────────────
  const renderAttendance = () => (
    <Section title="Attendance Records">
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Status</th><th>Late (min)</th><th>OT (min)</th></tr></thead>
        <tbody>{attendance.slice(0,100).map(a => <tr key={a.id}><td style={{fontWeight:600,fontSize:12}}>{a.user?.name}</td><td style={{fontSize:12}}>{a.date}</td><td style={{fontSize:12}}>{a.clockIn||'-'}</td><td style={{fontSize:12}}>{a.clockOut||'-'}</td>
          <td><span className={`badge ${a.status==='present'?'good':a.status==='absent'?'high':a.status==='late'?'pending':'average'}`}>{a.status}</span></td>
          <td>{a.lateMinutes||0}</td><td>{a.overtimeMinutes||0}</td>
        </tr>)}</tbody></table></div>
    </Section>
  );

  // ─── DISCIPLINARY ─────────────────────────
  const renderDisciplinary = () => (
    <Section title="Disciplinary Actions" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowDisciplinaryForm(true)}><Plus size={12} /> New Action</button>}>
      {showDisciplinaryForm && <QuickForm fields={['userId','actionType','title','description','issuedDate','effectiveDate','endDate']} labels={{userId:'Employee *',actionType:'Type *',title:'Title *',description:'Description',issuedDate:'Issued Date *',effectiveDate:'Effective Date',endDate:'End Date'}} types={{userId:'select',issuedDate:'date',effectiveDate:'date',endDate:'date'}} selectOptions={{userId:employees.map(e=>({value:e.id,label:e.name})),actionType:['verbal_warning','written_warning','final_warning','show_cause','suspension','investigation','improvement_plan','termination','other']}} onSave={async d => {d.userId=Number(d.userId);const r=await api('/api/hr/disciplinary','POST',d);if(r){showToast('Action recorded');setShowDisciplinaryForm(false);fetchAll();}} } onCancel={()=>setShowDisciplinaryForm(false)} />}
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Type</th><th>Title</th><th>Issued</th><th>Issued By</th><th>Status</th></tr></thead>
        <tbody>{disciplinary.map(d => <tr key={d.id}><td style={{fontWeight:600,fontSize:12}}>{d.user?.name}</td><td style={{fontSize:12}}>{d.actionType.replace(/_/g,' ')}</td><td>{d.title}</td><td style={{fontSize:12}}>{d.issuedDate}</td><td style={{fontSize:12}}>{d.issuer?.name||'-'}</td>
          <td><span className={`badge ${d.status==='resolved'?'excellent':d.status==='expired'?'good':'pending'}`}>{d.status}</span></td>
        </tr>)}</tbody></table></div>
    </Section>
  );

  // ─── EXIT ─────────────────────────────────
  const renderExit = () => (
    <Section title="Exit Management" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowExitForm(true)}><Plus size={12} /> Record</button>}>
      {showExitForm && <QuickForm fields={['userId','resignationDate','lastWorkingDay','noticePeriodDays','reason']} labels={{userId:'Employee *',resignationDate:'Resignation Date *',lastWorkingDay:'Last Working Day',noticePeriodDays:'Notice Period',reason:'Reason'}} types={{userId:'select',resignationDate:'date',lastWorkingDay:'date',noticePeriodDays:'number'}} selectOptions={{userId:employees.map(e=>({value:e.id,label:e.name}))}} onSave={async d => {d.userId=Number(d.userId);const r=await api('/api/hr/exit','POST',d);if(r){showToast('Exit record created');setShowExitForm(false);fetchAll();}} } onCancel={()=>setShowExitForm(false)} />}
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Resignation</th><th>Last Day</th><th>Clearance</th><th>Exp Letter</th><th>Relieving</th><th>Status</th></tr></thead>
        <tbody>{exits.map(e => <tr key={e.id}><td style={{fontWeight:600,fontSize:12}}>{e.user?.name}</td><td style={{fontSize:12}}>{e.resignationDate}</td><td style={{fontSize:12}}>{e.lastWorkingDay||'-'}</td>
          <td><span className={`badge ${e.clearanceStatus==='completed'?'good':e.clearanceStatus==='in_progress'?'pending':'high'}`}>{e.clearanceStatus}</span></td>
          <td style={{textAlign:'center'}}>{e.experienceLetterIssued ? <Check size={14} style={{color:'var(--success)'}}/> : <X size={14} style={{color:'var(--danger)'}}/>}</td>
          <td style={{textAlign:'center'}}>{e.relievingLetterIssued ? <Check size={14} style={{color:'var(--success)'}}/> : <X size={14} style={{color:'var(--danger)'}}/>}</td>
          <td><span className={`badge ${e.status==='completed'?'good':e.status==='pending'?'pending':'average'}`}>{e.status}</span></td>
        </tr>)}</tbody></table></div>
    </Section>
  );

  // ─── PROMOTIONS ───────────────────────────
  const renderPromotions = () => (
    <Section title="Promotions & Transfers" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowPromotionForm(true)}><Plus size={12} /> New</button>}>
      {showPromotionForm && <QuickForm fields={['userId','promotionType','newDesignation','newDepartment','newSalary','reason','effectiveDate']} labels={{userId:'Employee *',promotionType:'Type *',newDesignation:'New Designation',newDepartment:'New Department',newSalary:'New Salary',reason:'Reason',effectiveDate:'Effective Date *'}} types={{userId:'select',newSalary:'number',effectiveDate:'date'}} selectOptions={{userId:employees.map(e=>({value:e.id,label:e.name})),promotionType:['promotion','transfer','designation_change','salary_revision']}} onSave={async d => {d.userId=Number(d.userId);const r=await api('/api/hr/promotions','POST',d);if(r){showToast('Recorded');setShowPromotionForm(false);fetchAll();}} } onCancel={()=>setShowPromotionForm(false)} />}
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Type</th><th>New Role</th><th>New Dept</th><th>Effective</th><th>Status</th></tr></thead>
        <tbody>{promotions.map(p => <tr key={p.id}><td style={{fontWeight:600,fontSize:12}}>{p.user?.name}</td><td style={{fontSize:12}}>{p.promotionType.replace(/_/g,' ')}</td><td style={{fontSize:12}}>{p.newDesignation||'-'}</td><td style={{fontSize:12}}>{p.newDepartment||'-'}</td>
          <td style={{fontSize:12}}>{p.effectiveDate}</td><td><span className={`badge ${p.status==='approved'?'good':p.status==='rejected'?'high':'pending'}`}>{p.status}</span></td>
        </tr>)}</tbody></table></div>
    </Section>
  );

  // ─── PROBATION ────────────────────────────
  const renderProbation = () => (
    <Section title="Probation Management" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowProbationForm(true)}><Plus size={12} /> New</button>}>
      {showProbationForm && <QuickForm fields={['userId','startDate','endDate','probationPeriod']} labels={{userId:'Employee *',startDate:'Start *',endDate:'End *',probationPeriod:'Period (months)'}} types={{userId:'select',startDate:'date',endDate:'date',probationPeriod:'number'}} selectOptions={{userId:employees.filter(e=>e.role==='bda').map(e=>({value:e.id,label:e.name}))}} onSave={async d => {d.userId=Number(d.userId);const r=await api('/api/hr/probation','POST',d);if(r){showToast('Record created');setShowProbationForm(false);fetchAll();}} } onCancel={()=>setShowProbationForm(false)} />}
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Start</th><th>End</th><th>Extension</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{probation.map(p => <tr key={p.id}><td style={{fontWeight:600,fontSize:12}}>{p.user?.name}</td><td style={{fontSize:12}}>{p.probationPeriod}m</td><td style={{fontSize:12}}>{p.startDate}</td><td style={{fontSize:12}}>{p.endDate}</td><td style={{fontSize:12}}>{p.extensionMonths?`+${p.extensionMonths}m`:'-'}</td>
          <td><span className={`badge ${p.reviewStatus==='confirmed'?'excellent':p.reviewStatus==='extended'?'pending':'good'}`}>{p.reviewStatus}</span></td>
          <td>{isHR && p.reviewStatus==='ongoing' && <button className="btn btn-primary" style={{padding:'2px 6px',fontSize:11}} onClick={async()=>{await api(`/api/hr/probation/${p.id}`,'PUT',{reviewStatus:'confirmed'});fetchAll();showToast('Confirmed');}}><Check size={11}/> Confirm</button>}</td>
        </tr>)}</tbody></table></div>
    </Section>
  );

  // ─── RECOGNITION ──────────────────────────
  const renderRecognition = () => (
    <Section title="Employee Recognition" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowRecognitionForm(true)}><Plus size={12} /> Award</button>}>
      {showRecognitionForm && <QuickForm fields={['userId','recognitionType','title','description','awardedDate','incentiveAmount']} labels={{userId:'Employee *',recognitionType:'Type *',title:'Title *',description:'Description',awardedDate:'Date *',incentiveAmount:'Incentive'}} types={{userId:'select',awardedDate:'date',incentiveAmount:'number'}} selectOptions={{userId:employees.map(e=>({value:e.id,label:e.name})),recognitionType:['employee_of_month','employee_of_quarter','appreciation','achievement','award','certificate','milestone','spot_bonus','other']}} onSave={async d => {d.userId=Number(d.userId);const r=await api('/api/hr/recognition','POST',d);if(r){showToast('Recognition recorded');setShowRecognitionForm(false);fetchAll();}} } onCancel={()=>setShowRecognitionForm(false)} />}
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Type</th><th>Title</th><th>Date</th><th>Awarded By</th><th>Incentive</th></tr></thead>
        <tbody>{recognitions.map(r => <tr key={r.id}><td style={{fontWeight:600,fontSize:12}}>{r.user?.name}</td><td style={{fontSize:12}}>{r.recognitionType.replace(/_/g,' ')}</td><td>{r.title}</td><td style={{fontSize:12}}>{r.awardedDate}</td><td style={{fontSize:12}}>{r.awarder?.name||'-'}</td><td>{r.incentiveAmount?`$${r.incentiveAmount}`:'-'}</td></tr>)}</tbody></table></div>
    </Section>
  );

  // ─── ANNOUNCEMENTS ────────────────────────
  const renderAnnouncements = () => (
    <Section title="Announcements" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowAnnounceForm(true)}><Plus size={12} /> Post</button>}>
      {showAnnounceForm && <QuickForm fields={['title','content','category','priority','targetRoles']} labels={{title:'Title *',content:'Content *',category:'Category',priority:'Priority',targetRoles:'Target Roles'}} selectOptions={{category:['general','hr_update','policy','event','celebration','achievement','training','urgent','other'],priority:['low','normal','high','urgent'],targetRoles:['all','admin','hr','ops_head','team_lead','bda']}} onSave={async d => {const r=await api('/api/hr/announcements','POST',d);if(r){showToast('Announcement posted');setShowAnnounceForm(false);fetchAll();}} } onCancel={()=>setShowAnnounceForm(false)} />}
      <div style={{display:'grid',gap:12}}>{(announcements||[]).map(a => (
        <div key={a.id} style={{padding:12,borderRadius:8,border:'1px solid var(--border-color)',background:`${a.priority==='urgent'?'#FEF2F2':'var(--bg-main)'}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
            <div style={{fontWeight:600,fontSize:14}}>{a.title} {a.priority==='urgent'&&<span style={{color:'var(--danger)',fontSize:11}}>URGENT</span>}</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span className="badge pending">{a.category}</span>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>{a.creator?.name}</span>
              {!a.isRead && <button className="btn btn-secondary" style={{padding:'2px 6px',fontSize:11}} onClick={async()=>{await api(`/api/hr/announcements/${a.id}/read`,'PUT');fetchAll();}}>Mark Read</button>}
            </div>
          </div>
          <p style={{fontSize:13,whiteSpace:'pre-wrap',margin:0}}>{a.content}</p>
          <small style={{color:'var(--text-muted)'}}>{a.createdAt} | {a.readCount} read</small>
        </div>
      ))}</div>
    </Section>
  );

  // ─── POLICIES ─────────────────────────────
  const renderPolicies = () => (
    <Section title="Policies & Compliance" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowPolicyForm(true)}><Plus size={12} /> New Policy</button>}>
      {showPolicyForm && <QuickForm fields={['title','category','content','version','effectiveDate','requiresAcknowledgment']} labels={{title:'Title *',category:'Category',content:'Content',version:'Version',effectiveDate:'Effective',requiresAcknowledgment:'Require Ack?'}} types={{effectiveDate:'date',requiresAcknowledgment:'checkbox'}} selectOptions={{category:['hr','finance','it','admin','compliance','code_of_conduct','other']}} onSave={async d => {d.requiresAcknowledgment = d.requiresAcknowledgment === true || d.requiresAcknowledgment === 'true';const r=await api('/api/hr/policies','POST',d);if(r){showToast('Policy created');setShowPolicyForm(false);fetchAll();}} } onCancel={()=>setShowPolicyForm(false)} />}
      <div style={{display:'grid',gap:12}}>{(policies||[]).map(p => (
        <div key={p.id} style={{padding:12,borderRadius:8,border:'1px solid var(--border-color)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
            <div style={{fontWeight:600}}>{p.title} <span className="badge good" style={{marginLeft:8}}>v{p.version}</span></div>
            <span className="badge pending">{p.category}</span>
          </div>
          <p style={{fontSize:13,color:'var(--text-muted)',margin:0}}>{p.content?.slice(0,200)}</p>
          {p.requiresAcknowledgment && <button className="btn btn-secondary" style={{padding:'2px 8px',fontSize:11,marginTop:4}} onClick={async()=>{await api(`/api/hr/policies/${p.id}/acknowledge`,'PUT');showToast('Acknowledged');}}><Check size={11}/> Acknowledge</button>}
        </div>
      ))}</div>
    </Section>
  );

  // ─── SURVEYS ──────────────────────────────
  const renderSurveys = () => (
    <Section title="Employee Surveys" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowSurveyForm(true)}><Plus size={12} /> New Survey</button>}>
      {showSurveyForm && <QuickForm fields={['title','description','surveyType','startDate','endDate','anonymous']} labels={{title:'Title *',description:'Description',surveyType:'Type',startDate:'Start',endDate:'End',anonymous:'Anonymous?'}} types={{startDate:'date',endDate:'date',anonymous:'checkbox'}} selectOptions={{surveyType:['engagement','pulse','feedback','satisfaction','exit','training','other']}} onSave={async d => {d.anonymous = d.anonymous === true || d.anonymous === 'true';const r=await api('/api/hr/surveys','POST',d);if(r){showToast('Survey created');setShowSurveyForm(false);fetchAll();}} } onCancel={()=>setShowSurveyForm(false)} />}
      <div className="table-responsive"><table className="data-table"><thead><tr><th>Title</th><th>Type</th><th>Period</th><th>Anonymous</th><th>Status</th></tr></thead>
        <tbody>{surveys.map(s => <tr key={s.id}><td style={{fontWeight:600}}>{s.title}</td><td style={{fontSize:12}}>{s.surveyType}</td><td style={{fontSize:12}}>{s.startDate}-{s.endDate}</td><td style={{textAlign:'center'}}>{s.anonymous?<Check size={14} style={{color:'var(--success)'}}/>:<X size={14} style={{color:'var(--danger)'}}/>}</td>
          <td><span className={`badge ${s.status==='active'?'good':s.status==='closed'?'high':'pending'}`}>{s.status}</span></td>
        </tr>)}</tbody></table></div>
    </Section>
  );

  // ─── ANALYTICS ────────────────────────────
  const renderAnalytics = () => (
    <>
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Employees', value: analytics.totalEmployees, color: '#2563EB' },
          { label: 'Active', value: analytics.activeEmployees, color: '#16A34A' },
          { label: 'Attrition Rate', value: `${analytics.attritionRate||0}%`, color: analytics.attritionRate > 20 ? '#DC2626' : '#16A34A' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ borderLeft: `4px solid ${k.color}`, padding: '12px 16px' }}>
            <div className="kpi-card-title" style={{ fontSize: 11 }}>{k.label}</div>
            <div className="kpi-card-value" style={{ fontSize: 24 }}>{k.value}</div>
          </div>
        ))}
      </div>
      <Section title="Department Headcount">
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{Object.entries(analytics.departmentHeadcount||{}).map(([dept,count]) => (
          <div key={dept} style={{padding:'8px 16px',borderRadius:8,border:'1px solid var(--border-color)',textAlign:'center',minWidth:120}}>
            <div style={{fontWeight:600,fontSize:20}}>{count}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>{dept}</div>
          </div>
        ))}</div>
      </Section>
      <Section title="Recruitment Pipeline">
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{Object.entries(analytics.recruitmentPipeline||{}).map(([status,count]) => (
          <div key={status} style={{padding:'8px 16px',borderRadius:8,border:'1px solid var(--border-color)',textAlign:'center',minWidth:100}}>
            <div style={{fontWeight:600,fontSize:20}}>{count}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>{status.replace(/_/g,' ')}</div>
          </div>
        ))}</div>
      </Section>
    </>
  );

  // ─── AUDIT LOG ────────────────────────────
  const renderAuditLog = () => (
    <Section title="Audit Log">
      <div className="table-responsive" style={{maxHeight:500,overflow:'auto'}}><table className="data-table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
        <tbody>{logs.map(l => <tr key={l.id}><td style={{fontSize:11}}>{l.createdAt}</td><td style={{fontSize:12}}>{l.user?.name||'-'}</td><td style={{fontSize:12}}>{l.action}</td><td style={{fontSize:12}}>{l.entity}</td><td style={{fontSize:11,color:'var(--text-muted)'}}>{l.details?.slice(0,80)}</td></tr>)}</tbody></table></div>
    </Section>
  );

  // ─── OTHERS (Onboarding, standalone) ──────
  const renderOnboarding = () => (
    <Section title="Onboarding Tracker" action={isHR && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowOnboardingForm(true)}><Plus size={12} /> Start</button>}>
      {showOnboardingForm && <QuickForm fields={['userId','joiningDate','reportingManagerId','teamId']} labels={{userId:'Employee *',joiningDate:'Joining Date',reportingManagerId:'Reporting Manager',teamId:'Team'}} types={{userId:'select',joiningDate:'date',reportingManagerId:'select',teamId:'text'}} selectOptions={{userId:employees.map(e=>({value:e.id,label:e.name})),reportingManagerId:employees.filter(e=>['admin','hr','team_lead','ops_head'].includes(e.role)).map(e=>({value:e.id,label:e.name}))}} onSave={async d => {d.userId=Number(d.userId);if(d.reportingManagerId)d.reportingManagerId=Number(d.reportingManagerId);const r=await api('/api/hr/onboarding','POST',{...d,tasks:[{task:'Document Collection',category:'documentation'},{task:'Account Creation',category:'accounts'},{task:'Asset Allocation',category:'assets'},{task:'Induction',category:'induction'},{task:'Training',category:'training'},{task:'IT Setup',category:'it_setup'}]});if(r){showToast('Onboarding started');setShowOnboardingForm(false);fetchAll();}} } onCancel={()=>setShowOnboardingForm(false)} />}
      <div style={{display:'grid',gap:12}}>{(onboarding||[]).map(o => {
        const tasks = o.tasks||[];
        const done = tasks.filter(t => t.status === 'completed').length;
        return <div key={o.id} style={{padding:12,borderRadius:8,border:'1px solid var(--border-color)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div><strong>{o.user?.name}</strong> <span style={{fontSize:12,color:'var(--text-muted)',marginLeft:8}}>Joining: {o.joiningDate||'-'}</span></div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:12}}>{done}/{tasks.length}</span>
              <div style={{width:120,height:6,background:'var(--border-color)',borderRadius:3}}><div style={{width:`${tasks.length?(done/tasks.length*100):0}%`,height:6,background:'var(--success)',borderRadius:3}}/></div>
              <span className={`badge ${o.status==='completed'?'excellent':'good'}`}>{o.status}</span>
            </div>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{tasks.map(t => (
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,padding:'3px 8px',borderRadius:4,background:t.status==='completed'?'#DCFCE7':t.status==='in_progress'?'#FEF9C3':'#F3F4F6'}}>
              {t.status==='completed'?<Check size={12} style={{color:'var(--success)'}}/>:<span style={{width:8,height:8,borderRadius:'50%',background:'var(--border-color)',display:'inline-block'}}/>}
              {t.task}
              {isHR && t.status !== 'completed' && <button className="btn btn-secondary" style={{padding:'1px 4px',fontSize:10,marginLeft:4}} onClick={async()=>{await api(`/api/hr/onboarding-tasks/${t.id}`,'PUT',{status:'completed'});fetchAll();}}><Check size={10}/></button>}
            </div>
          ))}</div>
        </div>
      })}</div>
    </Section>
  );

  // ─── ONBOARDING (if standalone called) ─

  return (
    <div className="view-section active" id="hr-desk-view">
      <TabNav />
      {tab === 'overview' && renderOverview()}
      {tab === 'planner' && renderPlanner()}
      {tab === 'employees' && renderEmployees()}
      {tab === 'recruitment' && renderRecruitment()}
      {tab === 'onboarding' && renderOnboarding()}
      {tab === 'documents' && renderDocuments()}
      {tab === 'performance' && renderPerformance()}
      {tab === 'goals' && renderGoals()}
      {tab === 'training' && renderTraining()}
      {tab === 'skills' && renderSkills()}
      {tab === 'assets' && renderAssets()}
      {tab === 'attendance' && renderAttendance()}
      {tab === 'disciplinary' && renderDisciplinary()}
      {tab === 'exit' && renderExit()}
      {tab === 'promotions' && renderPromotions()}
      {tab === 'probation' && renderProbation()}
      {tab === 'recognition' && renderRecognition()}
      {tab === 'announcements' && renderAnnouncements()}
      {tab === 'policies' && renderPolicies()}
      {tab === 'surveys' && renderSurveys()}
      {tab === 'analytics' && renderAnalytics()}
      {tab === 'audit-log' && renderAuditLog()}
    </div>
  );
};

// ─── QUICK FORM COMPONENT ──────────────────
const QuickForm = ({ fields, labels, types = {}, selectOptions = {}, onSave, onCancel }) => {
  const [form, setForm] = useState({});
  return (
    <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-main)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {fields.map(f => (
          <div key={f} className="input-group" style={{ marginBottom: 4, gridColumn: ['content','description','requirements'].includes(f) ? 'span 2' : undefined }}>
            <label style={{ fontSize: 11 }}>{labels[f]}</label>
            {types[f] === 'select' && selectOptions[f] ? (
              <select className="table-select" value={form[f]||''} onChange={e => setForm({...form, [f]: e.target.value})}>
                <option value="">Select</option>
                {(selectOptions[f]||[]).map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : types[f] === 'checkbox' ? (
              <input type="checkbox" checked={form[f]||false} onChange={e => setForm({...form, [f]: e.target.checked})} style={{width:20,height:20}} />
            ) : (
              <input className="table-input" type={types[f]||'text'} value={form[f]||''} onChange={e => setForm({...form, [f]: e.target.value})} placeholder={labels[f]} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 12 }} onClick={() => onSave(form)}><Save size={12} /> Save</button>
        <button className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: 12 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default HrDesk;
