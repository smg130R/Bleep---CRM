import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import {
  Calendar, Users, Briefcase, UserPlus, FileText, TrendingUp,
  BookOpen, Clock, LogOut, ArrowUpDown, ArrowLeft,
  Award, Megaphone, Shield, BarChart3, ClipboardList, Search,
  Plus, Check, X, Edit3, Save, Loader,
  Gift, Bell, Target, MessageSquare
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const HR = ['admin', 'hr'];

const HrDesk = ({ showToast, activeHrTab = 'hr-planner' }) => {
  const { user } = useAuth();
  const isHR = HR.includes(user?.role);

  const [tab, setTab] = useState(activeHrTab.replace('hr-', ''));
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
  const [hrTeams, setHrTeams] = useState([]);
  const [hrSelectedTeam, setHrSelectedTeam] = useState(null);
  const [hrMembers, setHrMembers] = useState([]);
  const [hrTeamLoading, setHrTeamLoading] = useState(false);
  const [hrMemberLoading, setHrMemberLoading] = useState(false);
  const HR_TEAM_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316', '#06b6d4', '#ec4899'];
  const [searchTerm, setSearchTerm] = useState('');
  const [editProfile, setEditProfile] = useState(null);
  const [showForm, setShowForm] = useState(null);

  useEffect(() => { setTab(activeHrTab.replace('hr-', '')); }, [activeHrTab]);

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
      setOnboarding(r[8].onboarding); setReviews(r[9].reviews);
      setExits(r[10].exits); setPromotions(r[11].promotions); setProbation(r[12].probation);
      setAttendance(r[13].attendance); setAnnouncements(r[14].announcements);
      setRecognitions(r[15].recognitions); setPolicies(r[16].policies); setSurveys(r[17].surveys);
      setAnalytics(r[18]); setLogs(r[19].logs); setEmployees(r[20].employees || []);
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

  const fetchHrTeams = async () => {
    setHrTeamLoading(true);
    try {
      const res = await fetch('/api/kpi/teams-breakdown?range=today', { credentials: 'include' });
      if (res.ok) setHrTeams((await res.json()).teams || []);
    } catch (e) { console.error(e); }
    finally { setHrTeamLoading(false); }
  };

  const fetchHrMembers = async (teamId) => {
    setHrMemberLoading(true);
    try {
      const res = await fetch(`/api/kpi/team-members/${teamId}?range=today`, { credentials: 'include' });
      if (res.ok) setHrMembers((await res.json()).members || []);
    } catch (e) { console.error(e); }
    finally { setHrMemberLoading(false); }
  };

  const empName = (id) => employees.find(e => e.id === id)?.name || '-';
  const empOpts = () => employees.filter(e => e.status === 'active').map(e => ({ value: e.id, label: `${e.name} (${e.email})` }));
  const leaderOpts = () => employees.filter(e => ['admin', 'hr', 'team_lead', 'ops_head'].includes(e.role)).map(e => ({ value: e.id, label: e.name }));

  const Card = ({ label, value, color }) => (
    <div className="kpi-card" style={{ borderLeft: `4px solid ${color}`, padding: '14px 18px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );

  const Badge = ({ status, map }) => {
    const m = map || { completed:'excellent', active:'good', approved:'excellent', resolved:'excellent', present:'good', verified:'excellent', confirmed:'excellent', rejected:'high', cancelled:'high', suspended:'high', pending:'pending', in_progress:'average', ongoing:'good', scheduled:'pending' };
    return <span className={`badge ${m[status] || 'pending'}`} style={{ fontSize: 11, padding: '2px 8px' }}>{status?.replace(/_/g, ' ')}</span>;
  };

  const ProgressBar = ({ value, w = 100 }) => (
    <div style={{ width: w, height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: 6, background: value >= 80 ? 'var(--success)' : value >= 40 ? 'var(--warning)' : 'var(--danger)', borderRadius: 3 }} />
    </div>
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
                      <option value="">Select...</option>
                      {(f.options || []).map(o => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : isBig ? (
                    <textarea className="table-input" rows={3} value={fd[f.key] || ''} onChange={e => setFd({ ...fd, [f.key]: e.target.value })} style={{ width: '100%', resize: 'vertical' }} />
                  ) : (
                    <input className="table-input" type={isDate ? 'date' : isNum ? 'number' : 'text'} value={fd[f.key] || ''} onChange={e => setFd({ ...fd, [f.key]: e.target.value })} style={{ width: '100%' }} />
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

  if (!isHR && !['documents', 'announcements', 'policies'].includes(tab)) {
    return <div className="view-section active" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>You do not have access to this section.</div>;
  }

  // ─── EMPLOYEES ──────────────────────────────
  if (tab === 'employees') return (
    <div className="view-section active">
      <Section title="Employee Profiles" action={<input className="table-input" placeholder="Search..." style={{width:200}} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>}>
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
              {[['department','Department'],['designation','Designation'],['workLocation','Location'],['employmentType','Type',['Full-time','Part-time','Contract','Intern','Temporary']],['probationEndDate','Probation End','date'],['noticePeriodDays','Notice Period','number'],['emergencyContactName','Emergency Contact'],['emergencyContactPhone','Phone'],['emergencyContactRelation','Relation'],['bankName','Bank'],['bankAccountNumber','A/C'],['bankIfscCode','IFSC'],['panNumber','PAN'],['uanNumber','UAN'],['skills','Skills'],['certifications','Certifications']].map(([k, lbl, type]) => (
                <div key={k} style={{marginBottom:4}}><label style={{fontSize:11,fontWeight:600}}>{lbl}</label>
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
              <button className="btn btn-primary" style={{padding:'8px 24px'}} onClick={async()=>{const r=await api(`/api/hr/employee-ext/${editProfile.userId}`,'PUT',editProfile);if(r){showToast('Profile updated');setEditProfile(null);fetchAll();}}}><Save size={14}/> Save</button>
              <button className="btn btn-secondary" style={{padding:'8px 24px'}} onClick={()=>setEditProfile(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── PLANNER ────────────────────────────────
  if (tab === 'planner') return (
    <div className="view-section active">
      <Section title="HR Planner" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('planner')}><Plus size={12}/> Event</button>}>
        <div className="table-responsive" style={{maxHeight:520,overflow:'auto'}}><table className="data-table"><thead><tr><th style={{width:100}}>Date</th><th style={{width:90}}>Time</th><th>Title</th><th>Type</th><th style={{width:130}}>Status</th><th>Participants</th></tr></thead>
          <tbody>{events.length === 0 ? <tr><td colSpan={6} style={{textAlign:'center',padding:24,color:'var(--text-muted)'}}>No events.</td></tr> : events.map(e => (
            <tr key={e.id}><td style={{fontSize:12,whiteSpace:'nowrap'}}>{e.startDate}</td><td style={{fontSize:12}}>{e.startTime}</td><td style={{fontWeight:600,fontSize:13}}>{e.title}</td><td style={{fontSize:12}}>{e.eventType?.replace(/_/g,' ')}</td>
              <td><Badge status={e.status} map={{scheduled:'pending',in_progress:'average',completed:'excellent',cancelled:'high'}}/></td>
              <td style={{fontSize:12}}>{(e.participants||[]).map(p => p.user?.name).filter(Boolean).join(', ') || '-'}</td>
            </tr>
          ))}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── RECRUITMENT ────────────────────────────
  if (tab === 'recruitment') return (
    <div className="view-section active">
      <Section title="Job Openings" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('job')}><Plus size={12}/> Job</button>}>
        {showForm==='job'&&<ModalForm fields={[{key:'title',label:'Title',required:true},{key:'department',label:'Department'},{key:'location',label:'Location'},{key:'employmentType',label:'Type',type:'select',options:['Full-time','Part-time','Contract','Intern','Temporary']},{key:'openings',label:'Openings',type:'number'},{key:'description',label:'Description',type:'textarea'}]} onSave={async d=>{const r=await api('/api/hr/recruitment/jobs','POST',d);if(r){showToast('Job created');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Title</th><th>Dept</th><th>Location</th><th style={{width:60}}>Openings</th><th style={{width:60}}>Filled</th><th style={{width:130}}>Status</th></tr></thead>
          <tbody>{jobs.map(j => <tr key={j.id}><td style={{fontWeight:600}}>{j.title}</td><td style={{fontSize:12}}>{j.department}</td><td style={{fontSize:12}}>{j.location}</td><td>{j.openings}</td><td>{j.filledCount}</td><td><Badge status={j.status} map={{open:'good',in_progress:'average',closed:'high',on_hold:'pending'}}/></td></tr>)}</tbody></table></div>
      </Section>
      <Section title="Candidates" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('candidate')}><Plus size={12}/> Add</button>}>
        {showForm==='candidate'&&<ModalForm fields={[{key:'name',label:'Name',required:true},{key:'email',label:'Email'},{key:'phone',label:'Phone'},{key:'jobId',label:'Job',type:'select',options:jobs.map(j=>({value:j.id,label:j.title}))},{key:'currentCompany',label:'Company'},{key:'experienceYears',label:'Exp (yrs)',type:'number'},{key:'status',label:'Status',type:'select',options:['new','screened','shortlisted','interview_scheduled','interviewed','selected','offered','offer_accepted','joined','rejected','on_hold']},{key:'source',label:'Source'}]} onSave={async d=>{if(d.jobId)d.jobId=Number(d.jobId);const r=await api('/api/hr/recruitment/candidates','POST',d);if(r){showToast('Candidate added');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Name</th><th>Job</th><th>Phone</th><th>Company</th><th>Exp</th><th style={{width:150}}>Status</th></tr></thead>
          <tbody>{candidates.map(c => <tr key={c.id}><td style={{fontWeight:600}}>{c.name}</td><td style={{fontSize:12}}>{c.job?.title||'-'}</td><td style={{fontSize:12}}>{c.phone}</td><td style={{fontSize:12}}>{c.currentCompany||'-'}</td><td>{c.experienceYears}y</td><td><Badge status={c.status} map={{new:'pending',screened:'average',shortlisted:'good',interview_scheduled:'pending',interviewed:'average',selected:'good',offered:'pending',offer_accepted:'excellent',joined:'excellent',rejected:'high',on_hold:'pending'}}/></td></tr>)}</tbody></table></div>
      </Section>
      <Section title="Interview Schedule" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('interview')}><Plus size={12}/> Schedule</button>}>
        {showForm==='interview'&&<ModalForm fields={[{key:'candidateId',label:'Candidate',type:'select',required:true,options:candidates.map(c=>({value:c.id,label:c.name}))},{key:'jobId',label:'Job',type:'select',options:jobs.map(j=>({value:j.id,label:j.title}))},{key:'interviewType',label:'Type',type:'select',options:['Telephonic','Technical','HR','Managerial','Final','Group','Other']},{key:'interviewDate',label:'Date',type:'date',required:true},{key:'interviewTime',label:'Time',placeholder:'10:00'},{key:'mode',label:'Mode',type:'select',options:['in_person','video_call','telephonic']}]} onSave={async d=>{d.candidateId=Number(d.candidateId);if(d.jobId)d.jobId=Number(d.jobId);const r=await api('/api/hr/recruitment/interviews','POST',d);if(r){showToast('Interview scheduled');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Candidate</th><th>Job</th><th>Date</th><th>Type</th><th>Mode</th><th style={{width:130}}>Status</th><th>Rating</th></tr></thead>
          <tbody>{interviews.map(i => <tr key={i.id}><td style={{fontWeight:600}}>{i.candidate?.name}</td><td style={{fontSize:12}}>{i.job?.title||'-'}</td><td style={{fontSize:12}}>{i.interviewDate}</td><td style={{fontSize:12}}>{i.interviewType}</td><td style={{fontSize:12}}>{i.mode?.replace(/_/g,' ')}</td><td><Badge status={i.status} map={{scheduled:'pending',completed:'excellent',cancelled:'high',rescheduled:'pending'}}/></td><td>{i.rating||'-'}</td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── DOCUMENTS ──────────────────────────────
  if (tab === 'documents') return (
    <div className="view-section active">
      <Section title="Employee Documents" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('document')}><Plus size={12}/> Add</button>}>
        {showForm==='document'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'documentType',label:'Type',type:'select',required:true,options:['Aadhaar','PAN','Passport','Voter ID','Driving License','Educational Certificate','Experience Letter','Offer Letter','Appointment Letter','NDA','Contract','Bank Details','Tax Document','Emergency Contact','Other']},{key:'documentName',label:'Name',required:true},{key:'fileUrl',label:'File URL'},{key:'issueDate',label:'Issue',type:'date'},{key:'expiryDate',label:'Expiry',type:'date'}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/documents','POST',d);if(r){showToast('Document added');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
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

  // ─── ONBOARDING ─────────────────────────────
  if (tab === 'onboarding') return (
    <div className="view-section active">
      <Section title="Onboarding Tracker" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('onboarding')}><Plus size={12}/> Start</button>}>
        {showForm==='onboarding'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'joiningDate',label:'Joining Date',type:'date'},{key:'reportingManagerId',label:'Manager',type:'select',options:leaderOpts()}]} onSave={async d=>{d.userId=Number(d.userId);if(d.reportingManagerId)d.reportingManagerId=Number(d.reportingManagerId);const r=await api('/api/hr/onboarding','POST',{...d,tasks:[{task:'Document Collection',category:'documentation'},{task:'Account Creation',category:'accounts'},{task:'Asset Allocation',category:'assets'},{task:'Induction',category:'induction'},{task:'Training',category:'training'},{task:'IT Setup',category:'it_setup'}]});if(r){showToast('Onboarding started');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div style={{display:'grid',gap:14}}>{(onboarding||[]).map(o => {
          const tasks = o.tasks||[]; const done = tasks.filter(t => t.status === 'completed').length;
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

  // ─── PERFORMANCE ────────────────────────────
  if (tab === 'performance') return (
    <div className="view-section active">
      <Section title="Performance Reviews" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('review')}><Plus size={12}/> New</button>}>
        {showForm==='review'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'reviewTitle',label:'Title',required:true},{key:'reviewPeriod',label:'Period',type:'select',options:['monthly','quarterly','half_yearly','yearly','probation']},{key:'startDate',label:'Start',type:'date'},{key:'endDate',label:'End',type:'date'},{key:'managerId',label:'Manager',type:'select',options:leaderOpts()}]} onSave={async d=>{d.userId=Number(d.userId);if(d.managerId)d.managerId=Number(d.managerId);const r=await api('/api/hr/performance','POST',d);if(r){showToast('Review created');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Title</th><th>Period</th><th style={{width:60}}>Self</th><th style={{width:60}}>Mgr</th><th style={{width:60}}>Final</th><th style={{width:130}}>Status</th></tr></thead>
          <tbody>{reviews.map(r => <tr key={r.id}><td style={{fontWeight:600,fontSize:13}}>{r.user?.name}</td><td style={{fontSize:13}}>{r.reviewTitle}</td><td style={{fontSize:12}}>{r.reviewPeriod}</td><td>{r.selfRating||'-'}</td><td>{r.managerRating||'-'}</td><td style={{fontWeight:600}}>{r.finalRating||'-'}</td><td><Badge status={r.status}/></td></tr>)}</tbody></table></div>
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
        <div className="table-responsive" style={{maxHeight:500,overflow:'auto'}}><table className="data-table"><thead><tr><th>Employee</th><th>Date</th><th>In</th><th>Out</th><th style={{width:110}}>Status</th><th style={{width:60}}>Late</th><th style={{width:60}}>OT</th></tr></thead>
          <tbody>{attendance.slice(0,150).map(a => <tr key={a.id}><td style={{fontWeight:600,fontSize:13}}>{a.user?.name}</td><td style={{fontSize:12}}>{a.date}</td><td style={{fontSize:12}}>{a.clockIn||'-'}</td><td style={{fontSize:12}}>{a.clockOut||'-'}</td>
            <td><Badge status={a.status}/></td><td style={{fontSize:12}}>{a.lateMinutes||0}m</td><td style={{fontSize:12}}>{a.overtimeMinutes||0}m</td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── ANNOUNCEMENTS ──────────────────────────
  if (tab === 'announcements') return (
    <div className="view-section active">
      <Section title="Announcements" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('announcement')}><Plus size={12}/> Post</button>}>
        {showForm==='announcement'&&<ModalForm fields={[{key:'title',label:'Title',required:true},{key:'content',label:'Content',type:'textarea',required:true},{key:'category',label:'Category',type:'select',options:['general','hr_update','policy','event','celebration','achievement','training','urgent','other']},{key:'priority',label:'Priority',type:'select',options:['low','normal','high','urgent']}]} onSave={async d=>{const r=await api('/api/hr/announcements','POST',d);if(r){showToast('Posted');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div style={{display:'grid',gap:14}}>{(announcements||[]).map(a => (
          <div key={a.id} style={{padding:16,borderRadius:10,border:'1px solid var(--border-color)',background:a.priority==='urgent'?'#FEF2F2':a.priority==='high'?'#FFFBEB':'var(--bg-main)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
              <div><span style={{fontWeight:700,fontSize:15}}>{a.title}</span> {a.priority==='urgent'&&<span style={{fontSize:10,color:'#fff',background:'#DC2626',padding:'1px 8px',borderRadius:8,marginLeft:6}}>URGENT</span>}</div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}><span className="badge pending" style={{fontSize:10}}>{a.category}</span><span style={{fontSize:11,color:'var(--text-muted)'}}>{a.creator?.name}</span></div>
            </div>
            <p style={{fontSize:13,whiteSpace:'pre-wrap',margin:'4px 0',color:'var(--text-secondary)'}}>{a.content}</p>
            <div style={{display:'flex',gap:12,alignItems:'center',marginTop:6}}>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>{new Date(a.createdAt).toLocaleDateString()}</span>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>{a.readCount} read</span>
              {!a.isRead && <button className="btn btn-secondary" style={{padding:'2px 8px',fontSize:11}} onClick={async()=>{await api(`/api/hr/announcements/${a.id}/read`,'PUT');fetchAll();}}>Mark Read</button>}
            </div>
          </div>
        ))}</div>
      </Section>
    </div>
  );

  // ─── POLICIES ───────────────────────────────
  if (tab === 'policies') return (
    <div className="view-section active">
      <Section title="Policies & Compliance" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('policy')}><Plus size={12}/> New Policy</button>}>
        {showForm==='policy'&&<ModalForm fields={[{key:'title',label:'Title',required:true},{key:'category',label:'Category',type:'select',options:['hr','finance','it','admin','compliance','code_of_conduct','other']},{key:'content',label:'Content',type:'textarea'},{key:'version',label:'Version'},{key:'effectiveDate',label:'Effective',type:'date'}]} onSave={async d=>{const r=await api('/api/hr/policies','POST',d);if(r){showToast('Policy created');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
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

  // ─── EXIT ───────────────────────────────────
  if (tab === 'exit') return (
    <div className="view-section active">
      <Section title="Exit Management" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('exit')}><Plus size={12}/> Record</button>}>
        {showForm==='exit'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'resignationDate',label:'Resignation',type:'date',required:true},{key:'lastWorkingDay',label:'Last Day',type:'date'},{key:'noticePeriodDays',label:'Notice Period',type:'number'},{key:'reason',label:'Reason',type:'textarea'}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/exit','POST',d);if(r){showToast('Exit recorded');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Resigned</th><th>Last Day</th><th>Clearance</th><th>Settlement</th><th>Exp Letter</th><th style={{width:130}}>Status</th></tr></thead>
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
        {showForm==='promotion'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'promotionType',label:'Type',type:'select',required:true,options:['promotion','transfer','designation_change','salary_revision']},{key:'newDesignation',label:'New Designation'},{key:'newDepartment',label:'New Dept'},{key:'newSalary',label:'New Salary',type:'number'},{key:'effectiveDate',label:'Effective',type:'date',required:true},{key:'reason',label:'Reason'}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/promotions','POST',d);if(r){showToast('Recorded');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Type</th><th>New Role</th><th>New Dept</th><th>Effective</th><th style={{width:130}}>Status</th></tr></thead>
          <tbody>{promotions.map(p => <tr key={p.id}><td style={{fontWeight:600,fontSize:13}}>{p.user?.name}</td><td style={{fontSize:12}}>{p.promotionType?.replace(/_/g,' ')}</td><td style={{fontSize:12}}>{p.newDesignation||'-'}</td><td style={{fontSize:12}}>{p.newDepartment||'-'}</td><td style={{fontSize:12}}>{p.effectiveDate}</td><td><Badge status={p.status}/></td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── PROBATION ──────────────────────────────
  if (tab === 'probation') return (
    <div className="view-section active">
      <Section title="Probation Management" action={isHR && <button className="btn btn-primary" style={{padding:'4px 12px',fontSize:12}} onClick={()=>setShowForm('probation')}><Plus size={12}/> New</button>}>
        {showForm==='probation'&&<ModalForm fields={[{key:'userId',label:'Employee',type:'select',required:true,options:empOpts()},{key:'startDate',label:'Start',type:'date',required:true},{key:'endDate',label:'End',type:'date',required:true},{key:'probationPeriod',label:'Period (months)',type:'number'}]} onSave={async d=>{d.userId=Number(d.userId);const r=await api('/api/hr/probation','POST',d);if(r){showToast('Record created');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Start</th><th>End</th><th>Extension</th><th style={{width:130}}>Status</th><th></th></tr></thead>
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
        {showForm==='survey'&&<ModalForm fields={[{key:'title',label:'Title',required:true},{key:'description',label:'Description',type:'textarea'},{key:'surveyType',label:'Type',type:'select',options:['engagement','pulse','feedback','satisfaction','exit','training','other']},{key:'startDate',label:'Start',type:'date'},{key:'endDate',label:'End',type:'date'},{key:'anonymous',label:'Anonymous',type:'select',options:[{value:'true',label:'Yes'},{value:'false',label:'No'}]}]} onSave={async d=>{const r=await api('/api/hr/surveys','POST',d);if(r){showToast('Survey created');setShowForm(null);fetchAll();}}} onClose={()=>setShowForm(null)}/>}
        <div className="table-responsive"><table className="data-table"><thead><tr><th>Title</th><th>Type</th><th>Period</th><th>Anonymous</th><th style={{width:130}}>Status</th></tr></thead>
          <tbody>{surveys.map(s => <tr key={s.id}><td style={{fontWeight:600}}>{s.title}</td><td style={{fontSize:12}}>{s.surveyType}</td><td style={{fontSize:12}}>{s.startDate} &rarr; {s.endDate||'-'}</td>
            <td style={{textAlign:'center'}}>{s.anonymous==='true'||s.anonymous===true?<Check size={14} style={{color:'#16A34A'}}/>:<X size={14} style={{color:'#DC2626'}}/>}</td>
            <td><Badge status={s.status}/></td></tr>)}</tbody></table></div>
      </Section>
    </div>
  );

  // ─── ANALYTICS ──────────────────────────────
  // eslint-disable-next-line
  useEffect(() => { if (tab === 'analytics') fetchHrTeams(); }, [tab]);

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
            <div style={{fontWeight:700,fontSize:24}}>{count}</div>
            <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'capitalize'}}>{dept}</div>
          </div>
        ))}</div>
      </Section>

      {/* Division Performance Chart */}
      <div className="chart-card" style={{marginTop:20}}>
        <div className="chart-header">
          <h3>Division Performance</h3>
          <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>Click a team card to drill into BDAs</span>
        </div>
        <div className="chart-container" style={{height:280}}>
          {hrTeamLoading ? (
            <div style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>Loading teams...</div>
          ) : hrTeams.length ? (
            <Bar data={{
              labels: hrTeams.map(t => t.name),
              datasets: [{label:'Calls',data:hrTeams.map(t => t.calls),backgroundColor:hrTeams.map((_,i) => HR_TEAM_COLORS[i%HR_TEAM_COLORS.length]),borderRadius:6}]
            }} options={{
              responsive:true,maintainAspectRatio:false,
              plugins:{tooltip:{callbacks:{label:ctx=>`${ctx.raw} calls`}},legend:{display:false}},
              scales:{y:{beginAtZero:true,grid:{color:'#F1F5F9'}},x:{grid:{display:false}}},
            }} />
          ) : (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-muted)'}}>No data available</div>
          )}
        </div>
        {hrTeams.length > 0 && (
          <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap',padding:'0.75rem 1rem 1rem',borderTop:'1px solid var(--border)'}}>
            {hrTeams.map((t,i) => (
              <div key={t.id} onClick={() => { setHrSelectedTeam(t); fetchHrMembers(t.id); }} style={{
                display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.5rem 1rem',
                borderRadius:'8px',background:HR_TEAM_COLORS[i%HR_TEAM_COLORS.length]+'15',
                border:'1px solid '+HR_TEAM_COLORS[i%HR_TEAM_COLORS.length]+'30',
                cursor:'pointer',transition:'all 0.15s',
              }}>
                <div style={{width:8,height:8,borderRadius:'50%',background:HR_TEAM_COLORS[i%HR_TEAM_COLORS.length]}} />
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{t.name}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{t.calls} calls · {t.connects} conn</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Drill-down */}
      {hrSelectedTeam && (
        <div className="content-card" style={{padding:'1rem',marginTop:20}}>
          <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1rem'}}>
            <button className="btn btn-secondary" onClick={() => setHrSelectedTeam(null)} style={{display:'inline-flex',alignItems:'center',gap:'0.5rem'}}>
              <ArrowLeft size={14} /> Back
            </button>
            <h3 style={{margin:0}}>{hrSelectedTeam.name} — BDA Breakdown</h3>
          </div>
          {hrMemberLoading ? (
            <div style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Loading members...</div>
          ) : hrMembers.length > 0 ? (
            <div className="dashboard-grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))'}}>
              {hrMembers.map(m => (
                <div key={m.id} className="kpi-card blue">
                  <div className="kpi-card-header">
                    <span className="kpi-card-title">{m.name}</span>
                    <Users size={18} />
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginTop:'0.75rem'}}>
                    <div><span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Calls</span><div style={{fontSize:'1.1rem',fontWeight:700}}>{(m.mCalls||0)+(m.eCalls||0)}</div></div>
                    <div><span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Connects</span><div style={{fontSize:'1.1rem',fontWeight:700}}>{(m.mConn||0)+(m.eConn||0)}</div></div>
                    <div><span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Deals</span><div style={{fontSize:'1.1rem',fontWeight:700}}>{m.deals||0}</div></div>
                    <div><span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Score</span><div style={{fontSize:'1.1rem',fontWeight:700}}>{m.perfScore||0}</div></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No data for this team</div>
          )}
        </div>
      )}
    </div>
  );

  // ─── AUDIT LOG ──────────────────────────────
  if (tab === 'audit-log') return (
    <div className="view-section active">
      <Section title="Audit Log">
        <div className="table-responsive" style={{maxHeight:550,overflow:'auto'}}>
          <table className="data-table"><thead><tr><th style={{width:160}}>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
            <tbody>{logs.length === 0 ? <tr><td colSpan={5} style={{textAlign:'center',padding:24,color:'var(--text-muted)'}}>No audit records yet.</td></tr> : logs.slice(0,200).map(l => (
              <tr key={l.id}><td style={{fontSize:11,whiteSpace:'nowrap'}}>{l.createdAt}</td><td style={{fontSize:12}}>{l.user?.name||'-'}</td><td style={{fontSize:12}}>{l.action}</td><td style={{fontSize:12}}>{l.entity}</td><td style={{fontSize:11,color:'var(--text-muted)',maxWidth:300}}>{l.details?.slice(0,200)}</td></tr>
            ))}</tbody></table>
        </div>
      </Section>
    </div>
  );

  return <div className="view-section active" style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>Select a section from the sidebar.</div>;
};

export default HrDesk;
