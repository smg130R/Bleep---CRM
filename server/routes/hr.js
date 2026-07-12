const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const HR_ROLES = ['admin', 'hr'];
const CAN_VIEW = ['admin', 'hr', 'ops_head', 'team_lead'];

async function auditLog(userId, action, entity, entityId, details = '') {
  try {
    await supabase.from('hr_audit_log').insert({ userId, action, entity, entityId, details });
  } catch (e) { console.error('Audit log error:', e.message); }
}

// ─── DASHBOARD / OVERVIEW ─────────────────────────────
router.get('/overview', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data: users } = await supabase.from('users').select('id, name, role, status, teamId, joinedDate');
    const today = new Date().toISOString().split('T')[0];
    const total = users?.length || 0;
    const active = users?.filter(u => u.status === 'active').length || 0;
    const suspended = users?.filter(u => u.status === 'suspended').length || 0;

    const { count: onLeave } = await supabase.from('leaves').select('*', { count: 'exact', head: true }).eq('status', 'Approved').gte('toDate', today).lte('fromDate', today);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const newJoiners = users?.filter(u => u.joinedDate && u.joinedDate >= thirtyDaysAgo).length || 0;

    const { count: probCount } = await supabase.from('hr_probation').select('*', { count: 'exact', head: true }).eq('reviewStatus', 'ongoing');
    const { count: exitCount } = await supabase.from('hr_exit').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']);

    const { count: upcomingBirthdays } = await supabase.from('hr_employee_ext').select('*', { count: 'exact', head: true }).neq('dob', '');

    return res.json({
      totalEmployees: total, activeEmployees: active, suspendedEmployees: suspended,
      employeesOnLeave: onLeave || 0, newJoiners, inProbation: probCount || 0,
      inNoticePeriod: exitCount || 0, recentResignations: exitCount || 0, upcomingBirthdays: upcomingBirthdays || 0,
    });
  } catch (error) {
    console.error('HR overview error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── EMPLOYEE EXTENDED PROFILES ───────────────────────
router.get('/employee-ext', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    let query = supabase.from('hr_employee_ext').select('*, users!inner(id, name, email, role, phone, teamId, status, joinedDate, employeeCode)');
    if (!HR_ROLES.includes(req.user.role)) {
      query = query.eq('userId', req.user.id);
    }
    const { data } = await query;
    return res.json({ profiles: data || [] });
  } catch (error) {
    console.error('Get employee ext error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/employee-ext/:userId', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    delete updates.id; delete updates.userId; delete updates.users;

    const { data: existing } = await supabase.from('hr_employee_ext').select('id').eq('userId', userId).maybeSingle();
    if (existing) {
      await supabase.from('hr_employee_ext').update({ ...updates, updatedAt: new Date().toISOString() }).eq('userId', userId);
    } else {
      await supabase.from('hr_employee_ext').insert({ userId, ...updates });
    }
    await auditLog(req.user.id, 'update', 'employee_ext', userId, JSON.stringify(updates));
    return res.json({ message: 'Profile updated.' });
  } catch (error) {
    console.error('Update employee ext error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── DOCUMENTS ────────────────────────────────────────
router.get('/documents', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    let query = supabase.from('hr_documents').select('*, users(name, email)');
    if (!HR_ROLES.includes(req.user.role)) query = query.eq('userId', req.user.id);
    const { data } = await query.order('createdAt', { ascending: false });
    return res.json({ documents: data || [] });
  } catch (error) {
    console.error('Get documents error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/documents', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { userId, documentType, documentName, fileUrl, issueDate, expiryDate } = req.body;
    if (!userId || !documentType || !documentName) return res.status(400).json({ message: 'userId, documentType, documentName required.' });
    const { data, error } = await supabase.from('hr_documents').insert({ userId, documentType, documentName, fileUrl, issueDate, expiryDate }).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'document', data.id, documentName);
    return res.status(201).json({ message: 'Document added.', document: data });
  } catch (error) {
    console.error('Add document error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/documents/:id/verify', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, notes } = req.body;
    await supabase.from('hr_documents').update({
      verificationStatus, notes, verifiedBy: req.user.id,
      verifiedAt: new Date().toISOString(), status: verificationStatus === 'verified' ? 'verified' : 'rejected',
    }).eq('id', id);
    await auditLog(req.user.id, 'verify', 'document', Number(id), verificationStatus);
    return res.json({ message: 'Document updated.' });
  } catch (error) {
    console.error('Verify document error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/documents/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    await supabase.from('hr_documents').delete().eq('id', req.params.id);
    return res.json({ message: 'Document removed.' });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── PLANNER ──────────────────────────────────────────
router.get('/planner', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    const { start, end, type, userId } = req.query;
    let query = supabase.from('hr_planner').select('*, creator:createdBy(name), participants:hr_planner_participants(*, user:userId(name, email))');
    if (!HR_ROLES.includes(req.user.role)) {
      query = query.or(`createdBy.eq.${req.user.id},participants.userId.eq.${req.user.id}`);
    }
    if (start) query = query.gte('startDate', start);
    if (end) query = query.lte('startDate', end);
    if (type) query = query.eq('eventType', type);
    if (userId) query = query.eq('createdBy', userId);
    const { data } = await query.order('startDate', { ascending: true }).order('startTime', { ascending: true });
    return res.json({ events: data || [] });
  } catch (error) {
    console.error('Get planner error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/planner', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { title, eventType, description, startDate, endDate, startTime, endTime, allDay, recurring, location, meetingLink, participantIds } = req.body;
    if (!title || !eventType || !startDate) return res.status(400).json({ message: 'title, eventType, startDate required.' });
    const { data, error } = await supabase.from('hr_planner').insert({
      title, eventType, description, startDate, endDate, startTime, endTime, allDay, recurring, location, meetingLink,
      createdBy: req.user.id,
    }).select().single();
    if (error) throw error;
    if (participantIds?.length > 0) {
      await supabase.from('hr_planner_participants').insert(participantIds.map(uid => ({ eventId: data.id, userId: uid })));
    }
    await auditLog(req.user.id, 'create', 'planner', data.id, title);
    return res.status(201).json({ message: 'Event created.', event: data });
  } catch (error) {
    console.error('Create planner error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/planner/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates.id; delete updates.createdBy; delete updates.creator; delete updates.participants;
    const participantIds = updates.participantIds; delete updates.participantIds;
    await supabase.from('hr_planner').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', id);
    if (participantIds) {
      await supabase.from('hr_planner_participants').delete().eq('eventId', id);
      if (participantIds.length > 0) {
        await supabase.from('hr_planner_participants').insert(participantIds.map(uid => ({ eventId: id, userId: uid })));
      }
    }
    await auditLog(req.user.id, 'update', 'planner', Number(id));
    return res.json({ message: 'Event updated.' });
  } catch (error) {
    console.error('Update planner error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/planner/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    await supabase.from('hr_planner').delete().eq('id', req.params.id);
    return res.json({ message: 'Event deleted.' });
  } catch (error) {
    console.error('Delete planner error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/planner/:id/rsvp', authenticateToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const { data: existing } = await supabase.from('hr_planner_participants').select('id').eq('eventId', req.params.id).eq('userId', req.user.id).maybeSingle();
    if (existing) {
      await supabase.from('hr_planner_participants').update({ status, notes }).eq('id', existing.id);
    } else {
      await supabase.from('hr_planner_participants').insert({ eventId: Number(req.params.id), userId: req.user.id, status, notes });
    }
    return res.json({ message: 'RSVP updated.' });
  } catch (error) {
    console.error('RSVP error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── RECRUITMENT ──────────────────────────────────────
router.get('/recruitment/jobs', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    const { data } = await supabase.from('hr_recruitment_jobs').select('*').order('createdAt', { ascending: false });
    return res.json({ jobs: data || [] });
  } catch (error) {
    console.error('Get jobs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/recruitment/jobs', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_recruitment_jobs').insert({ ...req.body, createdBy: req.user.id }).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'recruitment_job', data.id, data.title);
    return res.status(201).json({ message: 'Job created.', job: data });
  } catch (error) {
    console.error('Create job error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/recruitment/jobs/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const updates = req.body; delete updates.id; delete updates.createdBy;
    await supabase.from('hr_recruitment_jobs').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', req.params.id);
    return res.json({ message: 'Job updated.' });
  } catch (error) {
    console.error('Update job error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/recruitment/candidates', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    const { jobId, status: filterStatus } = req.query;
    let query = supabase.from('hr_recruitment_candidates').select('*, job:jobId(title)');
    if (jobId) query = query.eq('jobId', jobId);
    if (filterStatus) query = query.eq('status', filterStatus);
    const { data } = await query.order('createdAt', { ascending: false });
    return res.json({ candidates: data || [] });
  } catch (error) {
    console.error('Get candidates error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/recruitment/candidates', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_recruitment_candidates').insert({ ...req.body, createdBy: req.user.id }).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'recruitment_candidate', data.id, data.name);
    return res.status(201).json({ message: 'Candidate added.', candidate: data });
  } catch (error) {
    console.error('Create candidate error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/recruitment/candidates/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const updates = req.body; delete updates.id; delete updates.job;
    await supabase.from('hr_recruitment_candidates').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', req.params.id);
    return res.json({ message: 'Candidate updated.' });
  } catch (error) {
    console.error('Update candidate error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/recruitment/interviews', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    const { candidateId, date } = req.query;
    let query = supabase.from('hr_recruitment_interviews').select('*, candidate:candidateId(name, email, phone), job:jobId(title)');
    if (candidateId) query = query.eq('candidateId', candidateId);
    if (date) query = query.eq('interviewDate', date);
    const { data } = await query.order('interviewDate', { ascending: false });
    return res.json({ interviews: data || [] });
  } catch (error) {
    console.error('Get interviews error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/recruitment/interviews', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_recruitment_interviews').insert(req.body).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'recruitment_interview', data.id);
    return res.status(201).json({ message: 'Interview scheduled.', interview: data });
  } catch (error) {
    console.error('Create interview error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/recruitment/interviews/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    await supabase.from('hr_recruitment_interviews').update(req.body).eq('id', req.params.id);
    return res.json({ message: 'Interview updated.' });
  } catch (error) {
    console.error('Update interview error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── ONBOARDING ───────────────────────────────────────
router.get('/onboarding', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    let query = supabase.from('hr_onboarding').select('*, user:userId(name, email, role, teamId), manager:reportingManagerId(name), tasks:hr_onboarding_tasks(*)');
    if (!HR_ROLES.includes(req.user.role)) query = query.eq('userId', req.user.id);
    const { data } = await query.order('createdAt', { ascending: false });
    return res.json({ onboarding: data || [] });
  } catch (error) {
    console.error('Get onboarding error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/onboarding', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_onboarding').insert(req.body).select().single();
    if (error) throw error;
    if (req.body.tasks) {
      await supabase.from('hr_onboarding_tasks').insert(req.body.tasks.map((t, i) => ({ onboardingId: data.id, ...t, sortOrder: i })));
    }
    await auditLog(req.user.id, 'create', 'onboarding', data.id);
    return res.status(201).json({ message: 'Onboarding started.', onboarding: data });
  } catch (error) {
    console.error('Create onboarding error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/onboarding/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    await supabase.from('hr_onboarding').update({ ...req.body, updatedAt: new Date().toISOString() }).eq('id', req.params.id);
    return res.json({ message: 'Onboarding updated.' });
  } catch (error) {
    console.error('Update onboarding error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/onboarding-tasks/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const updates = req.body;
    if (updates.status === 'completed') { updates.completedAt = new Date().toISOString(); updates.completedBy = req.user.id; }
    await supabase.from('hr_onboarding_tasks').update(updates).eq('id', req.params.id);
    return res.json({ message: 'Task updated.' });
  } catch (error) {
    console.error('Update onboarding task error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── PERFORMANCE ──────────────────────────────────────
router.get('/performance', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    let query = supabase.from('hr_performance_reviews').select('*, user:userId(name, email, role, teamId), manager:managerId(name)');
    if (!HR_ROLES.includes(req.user.role)) query = query.eq('userId', req.user.id);
    const { data } = await query.order('createdAt', { ascending: false });
    return res.json({ reviews: data || [] });
  } catch (error) {
    console.error('Get performance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/performance', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_performance_reviews').insert(req.body).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'performance_review', data.id);
    return res.status(201).json({ message: 'Review created.', review: data });
  } catch (error) {
    console.error('Create performance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/performance/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    await supabase.from('hr_performance_reviews').update({ ...req.body, updatedAt: new Date().toISOString() }).eq('id', req.params.id);
    return res.json({ message: 'Review updated.' });
  } catch (error) {
    console.error('Update performance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── GOALS ────────────────────────────────────────────
router.get('/goals', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    let query = supabase.from('hr_goals').select('*, user:userId(name)');
    if (!HR_ROLES.includes(req.user.role)) query = query.eq('userId', req.user.id);
    const { data } = await query.order('createdAt', { ascending: false });
    return res.json({ goals: data || [] });
  } catch (error) {
    console.error('Get goals error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/goals', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_goals').insert(req.body).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'goal', data.id);
    return res.status(201).json({ message: 'Goal created.', goal: data });
  } catch (error) {
    console.error('Create goal error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/goals/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    await supabase.from('hr_goals').update({ ...req.body, updatedAt: new Date().toISOString() }).eq('id', req.params.id);
    return res.json({ message: 'Goal updated.' });
  } catch (error) {
    console.error('Update goal error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── TRAINING ─────────────────────────────────────────
router.get('/training', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    let query = supabase.from('hr_training').select('*, user:userId(name, email)');
    if (!HR_ROLES.includes(req.user.role)) query = query.eq('userId', req.user.id);
    const { data } = await query.order('createdAt', { ascending: false });
    return res.json({ training: data || [] });
  } catch (error) {
    console.error('Get training error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/training', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_training').insert(req.body).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'training', data.id);
    return res.status(201).json({ message: 'Training assigned.', training: data });
  } catch (error) {
    console.error('Create training error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/training/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    await supabase.from('hr_training').update({ ...req.body, updatedAt: new Date().toISOString() }).eq('id', req.params.id);
    return res.json({ message: 'Training updated.' });
  } catch (error) {
    console.error('Update training error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── SKILLS ───────────────────────────────────────────
router.get('/skills', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    let query = supabase.from('hr_skill_matrix').select('*, user:userId(name, email)');
    if (!HR_ROLES.includes(req.user.role)) query = query.eq('userId', req.user.id);
    const { data } = await query.order('skill');
    return res.json({ skills: data || [] });
  } catch (error) {
    console.error('Get skills error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/skills', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_skill_matrix').insert(req.body).select().single();
    if (error && error.code === '23505') return res.status(400).json({ message: 'Skill already exists for this user.' });
    if (error) throw error;
    return res.status(201).json({ message: 'Skill added.', skill: data });
  } catch (error) {
    console.error('Add skill error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/skills/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    await supabase.from('hr_skill_matrix').update(req.body).eq('id', req.params.id);
    return res.json({ message: 'Skill updated.' });
  } catch (error) {
    console.error('Update skill error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/skills/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    await supabase.from('hr_skill_matrix').delete().eq('id', req.params.id);
    return res.json({ message: 'Skill removed.' });
  } catch (error) {
    console.error('Delete skill error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── ASSETS ───────────────────────────────────────────
router.get('/assets', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    let query = supabase.from('hr_assets').select('*, user:userId(name, email), history:hr_asset_history(*)');
    if (!HR_ROLES.includes(req.user.role)) query = query.eq('userId', req.user.id);
    const { data } = await query.order('allocatedDate', { ascending: false });
    return res.json({ assets: data || [] });
  } catch (error) {
    console.error('Get assets error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/assets', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_assets').insert(req.body).select().single();
    if (error) throw error;
    await supabase.from('hr_asset_history').insert({ assetId: data.id, userId: req.body.userId, action: 'allocated', changedBy: req.user.id });
    await auditLog(req.user.id, 'create', 'asset', data.id);
    return res.status(201).json({ message: 'Asset allocated.', asset: data });
  } catch (error) {
    console.error('Create asset error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/assets/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data: old } = await supabase.from('hr_assets').select('*').eq('id', req.params.id).single();
    await supabase.from('hr_assets').update(req.body).eq('id', req.params.id);
    await supabase.from('hr_asset_history').insert({ assetId: Number(req.params.id), userId: old?.userId, action: 'updated', previousValue: JSON.stringify(old), newValue: JSON.stringify(req.body), changedBy: req.user.id });
    return res.json({ message: 'Asset updated.' });
  } catch (error) {
    console.error('Update asset error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/assets/:id/return', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    await supabase.from('hr_assets').update({ status: 'returned', returnDate: new Date().toISOString().split('T')[0] }).eq('id', req.params.id);
    await supabase.from('hr_asset_history').insert({ assetId: Number(req.params.id), action: 'returned', changedBy: req.user.id });
    return res.json({ message: 'Asset returned.' });
  } catch (error) {
    console.error('Return asset error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── DISCIPLINARY ─────────────────────────────────────
router.get('/disciplinary', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    let query = supabase.from('hr_disciplinary').select('*, user:userId(name, email), issuer:issuedBy(name)');
    const { data } = await query.order('issuedDate', { ascending: false });
    return res.json({ actions: data || [] });
  } catch (error) {
    console.error('Get disciplinary error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/disciplinary', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_disciplinary').insert({ ...req.body, issuedBy: req.user.id }).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'disciplinary', data.id);
    return res.status(201).json({ message: 'Action recorded.', action: data });
  } catch (error) {
    console.error('Create disciplinary error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/disciplinary/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const updates = req.body;
    if (updates.status === 'resolved') { updates.resolvedAt = new Date().toISOString(); updates.resolvedBy = req.user.id; }
    await supabase.from('hr_disciplinary').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', req.params.id);
    return res.json({ message: 'Updated.' });
  } catch (error) {
    console.error('Update disciplinary error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── EXIT ─────────────────────────────────────────────
router.get('/exit', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    let query = supabase.from('hr_exit').select('*, user:userId(name, email, role, teamId)');
    const { data } = await query.order('createdAt', { ascending: false });
    return res.json({ exits: data || [] });
  } catch (error) {
    console.error('Get exit error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/exit', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_exit').insert(req.body).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'exit', data.id);
    return res.status(201).json({ message: 'Exit record created.', exit: data });
  } catch (error) {
    console.error('Create exit error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/exit/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    await supabase.from('hr_exit').update({ ...req.body, updatedAt: new Date().toISOString() }).eq('id', req.params.id);
    return res.json({ message: 'Exit updated.' });
  } catch (error) {
    console.error('Update exit error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── PROMOTIONS ───────────────────────────────────────
router.get('/promotions', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    const { data } = await supabase.from('hr_promotions').select('*, user:userId(name, email), approver:approvedBy(name)').order('createdAt', { ascending: false });
    return res.json({ promotions: data || [] });
  } catch (error) {
    console.error('Get promotions error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/promotions', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_promotions').insert({ ...req.body, approvedBy: req.user.id }).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'promotion', data.id);
    return res.status(201).json({ message: 'Promotion recorded.', promotion: data });
  } catch (error) {
    console.error('Create promotion error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── PROBATION ────────────────────────────────────────
router.get('/probation', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    const { data } = await supabase.from('hr_probation').select('*, user:userId(name, email, role, teamId)').order('createdAt', { ascending: false });
    return res.json({ probation: data || [] });
  } catch (error) {
    console.error('Get probation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/probation', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_probation').insert(req.body).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'probation', data.id);
    return res.status(201).json({ message: 'Probation record created.', probation: data });
  } catch (error) {
    console.error('Create probation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/probation/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const updates = req.body;
    if (updates.reviewStatus === 'confirmed') { updates.confirmedDate = new Date().toISOString().split('T')[0]; updates.confirmedBy = req.user.id; }
    await supabase.from('hr_probation').update({ ...updates, updatedAt: new Date().toISOString() }).eq('id', req.params.id);
    return res.json({ message: 'Probation updated.' });
  } catch (error) {
    console.error('Update probation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── ATTENDANCE ───────────────────────────────────────
router.get('/attendance', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    const { start, end, userId: filterUid } = req.query;
    let query = supabase.from('hr_attendance').select('*, user:userId(name, email)');
    if (!HR_ROLES.includes(req.user.role)) query = query.eq('userId', req.user.id);
    if (filterUid && HR_ROLES.includes(req.user.role)) query = query.eq('userId', filterUid);
    if (start) query = query.gte('date', start);
    if (end) query = query.lte('date', end);
    const { data } = await query.order('date', { ascending: false });
    return res.json({ attendance: data || [] });
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/attendance/bulk', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { records } = req.body;
    if (!records?.length) return res.status(400).json({ message: 'No records.' });
    for (const rec of records) {
      await supabase.from('hr_attendance').upsert(rec, { onConflict: 'userId,date' });
    }
    return res.json({ message: `${records.length} attendance records saved.` });
  } catch (error) {
    console.error('Bulk attendance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/attendance/:id', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    await supabase.from('hr_attendance').update(req.body).eq('id', req.params.id);
    return res.json({ message: 'Attendance updated.' });
  } catch (error) {
    console.error('Update attendance error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── ANNOUNCEMENTS ────────────────────────────────────
router.get('/announcements', authenticateToken, async (req, res) => {
  try {
    const { data } = await supabase.from('hr_announcements').select('*, creator:createdBy(name), reads:hr_announcement_reads(userId, readAt)').eq('status', 'active').order('createdAt', { ascending: false });
    const enriched = (data || []).map(a => ({
      ...a,
      isRead: a.reads?.some(r => r.userId === req.user.id) || false,
      readCount: a.reads?.length || 0,
    }));
    return res.json({ announcements: enriched });
  } catch (error) {
    console.error('Get announcements error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/announcements', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_announcements').insert({ ...req.body, createdBy: req.user.id }).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'announcement', data.id);
    return res.status(201).json({ message: 'Announcement posted.', announcement: data });
  } catch (error) {
    console.error('Create announcement error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/announcements/:id/read', authenticateToken, async (req, res) => {
  try {
    await supabase.from('hr_announcement_reads').upsert({ announcementId: Number(req.params.id), userId: req.user.id }, { onConflict: 'announcementId,userId' });
    return res.json({ message: 'Marked as read.' });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── RECOGNITION ──────────────────────────────────────
router.get('/recognition', authenticateToken, requireRoles(CAN_VIEW), async (req, res) => {
  try {
    const { data } = await supabase.from('hr_recognition').select('*, user:userId(name, email), awarder:awardedBy(name)').order('awardedDate', { ascending: false });
    return res.json({ recognitions: data || [] });
  } catch (error) {
    console.error('Get recognition error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/recognition', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_recognition').insert({ ...req.body, awardedBy: req.user.id }).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'recognition', data.id);
    return res.status(201).json({ message: 'Recognition recorded.', recognition: data });
  } catch (error) {
    console.error('Create recognition error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── POLICIES ─────────────────────────────────────────
router.get('/policies', authenticateToken, async (req, res) => {
  try {
    const { data } = await supabase.from('hr_policies').select('*').eq('status', 'active').order('createdAt', { ascending: false });
    return res.json({ policies: data || [] });
  } catch (error) {
    console.error('Get policies error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/policies', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_policies').insert({ ...req.body, createdBy: req.user.id }).select().single();
    if (error) throw error;
    await auditLog(req.user.id, 'create', 'policy', data.id, data.title);
    return res.status(201).json({ message: 'Policy created.', policy: data });
  } catch (error) {
    console.error('Create policy error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/policies/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    await supabase.from('hr_policy_acknowledgements').upsert({
      policyId: Number(req.params.id), userId: req.user.id, acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
    }, { onConflict: 'policyId,userId' });
    return res.json({ message: 'Policy acknowledged.' });
  } catch (error) {
    console.error('Acknowledge policy error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── SURVEYS ──────────────────────────────────────────
router.get('/surveys', authenticateToken, async (req, res) => {
  try {
    const { data } = await supabase.from('hr_surveys').select('*, creator:createdBy(name)').order('createdAt', { ascending: false });
    return res.json({ surveys: data || [] });
  } catch (error) {
    console.error('Get surveys error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/surveys', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data, error } = await supabase.from('hr_surveys').insert({ ...req.body, createdBy: req.user.id }).select().single();
    if (error) throw error;
    return res.status(201).json({ message: 'Survey created.', survey: data });
  } catch (error) {
    console.error('Create survey error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/surveys/:id/respond', authenticateToken, async (req, res) => {
  try {
    const { responses } = req.body;
    await supabase.from('hr_survey_responses').upsert({
      surveyId: Number(req.params.id), userId: req.user.id, responses: JSON.stringify(responses),
    }, { onConflict: 'surveyId,userId' });
    return res.json({ message: 'Response submitted.' });
  } catch (error) {
    console.error('Submit survey response error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── AUDIT LOG ────────────────────────────────────────
router.get('/audit-log', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { entity, userId } = req.query;
    let query = supabase.from('hr_audit_log').select('*, user:userId(name)');
    if (entity) query = query.eq('entity', entity);
    if (userId) query = query.eq('userId', userId);
    const { data } = await query.order('createdAt', { ascending: false }).limit(200);
    return res.json({ logs: data || [] });
  } catch (error) {
    console.error('Get audit log error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── NOTICES / UPCOMING ───────────────────────────────
router.get('/notices', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const nextMonthEnd = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const notices = [];

    // Upcoming birthdays
    const { data: birthdays } = await supabase.from('hr_employee_ext').select('userId, users(name, email)').neq('dob', '');
    (birthdays || []).forEach(b => {
      if (b.dob) {
        const dob = b.dob.slice(5);
        notices.push({ type: 'birthday', title: `${b.users?.name}'s Birthday`, date: `${today.slice(0, 5)}${dob}`, userId: b.userId, priority: 'normal' });
      }
    });

    // Probation ending soon
    const { data: probEnd } = await supabase.from('hr_probation').select('*, user:userId(name)').eq('reviewStatus', 'ongoing').lte('endDate', nextMonthEnd).gte('endDate', today);
    (probEnd || []).forEach(p => {
      notices.push({ type: 'probation_end', title: `${p.users?.name}'s Probation Ends`, date: p.endDate, userId: p.userId, priority: 'high' });
    });

    // Document expiry
    const { data: docExpiry } = await supabase.from('hr_documents').select('*, user:userId(name)').not('expiryDate', 'is', null).lte('expiryDate', nextMonthEnd).gte('expiryDate', today);
    (docExpiry || []).forEach(d => {
      notices.push({ type: 'document_expiry', title: `${d.users?.name}'s ${d.documentType} Expires`, date: d.expiryDate, userId: d.userId, priority: 'high' });
    });

    // Training expiry
    const { data: trainExpiry } = await supabase.from('hr_training').select('*, user:userId(name)').not('expiryDate', 'is', null).lte('expiryDate', nextMonthEnd).gte('expiryDate', today);
    (trainExpiry || []).forEach(t => {
      notices.push({ type: 'training_expiry', title: `${t.users?.name}'s ${t.trainingName} Expires`, date: t.expiryDate, userId: t.userId, priority: 'normal' });
    });

    // Upcoming reviews
    const { data: reviews } = await supabase.from('hr_performance_reviews').select('*, user:userId(name)').in('status', ['pending', 'self_review', 'manager_review', 'hr_review']);
    (reviews || []).forEach(r => {
      notices.push({ type: 'review', title: `${r.reviewTitle} for ${r.users?.name}`, date: r.endDate || r.startDate, userId: r.userId, priority: 'high' });
    });

    // Upcoming events
    const { data: events } = await supabase.from('hr_planner').select('*').gte('startDate', today).lte('startDate', nextWeek).eq('status', 'scheduled');
    (events || []).forEach(e => {
      notices.push({ type: 'event', title: e.title, date: e.startDate, eventId: e.id, priority: 'normal' });
    });

    // Employees on notice period (exit pending)
    const { data: exits } = await supabase.from('hr_exit').select('*, user:userId(name)').in('status', ['pending', 'in_progress']);
    (exits || []).forEach(e => {
      notices.push({ type: 'exit', title: `${e.users?.name} - Resignation`, date: e.lastWorkingDay || e.resignationDate, userId: e.userId, priority: 'urgent' });
    });

    notices.sort((a, b) => a.date?.localeCompare(b.date || '') || 0);
    return res.json({ notices });
  } catch (error) {
    console.error('Get notices error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// ─── ANALYTICS ────────────────────────────────────────
router.get('/analytics', authenticateToken, requireRoles(HR_ROLES), async (req, res) => {
  try {
    const { data: users } = await supabase.from('users').select('id, name, role, status, teamId, joinedDate');
    const total = users?.length || 0;
    const active = users?.filter(u => u.status === 'active').length || 0;
    const deptCounts = {};
    (users || []).forEach(u => { const d = u.role || 'unassigned'; deptCounts[d] = (deptCounts[d] || 0) + 1; });
    const attrition = total > 0 ? Math.round((1 - active / total) * 100) : 0;

    const { data: attendance } = await supabase.from('hr_attendance').select('status');
    const attCounts = {}; (attendance || []).forEach(a => { attCounts[a.status] = (attCounts[a.status] || 0) + 1; });

    const { data: goals } = await supabase.from('hr_goals').select('status');
    const goalCounts = {}; (goals || []).forEach(g => { goalCounts[g.status] = (goalCounts[g.status] || 0) + 1; });

    const { data: candidates } = await supabase.from('hr_recruitment_candidates').select('status');
    const pipeline = {}; (candidates || []).forEach(c => { pipeline[c.status] = (pipeline[c.status] || 0) + 1; });

    return res.json({
      totalEmployees: total, activeEmployees: active, attritionRate: attrition,
      departmentHeadcount: deptCounts, attendanceSummary: attCounts,
      goalSummary: goalCounts, recruitmentPipeline: pipeline,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
