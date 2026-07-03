const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/leaves - View leave requests
// HR and Admin view all. Employees view their own.
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = supabase
      .from('leaves')
      .select('*, users(name, role, teamId, employeeCode)');

    if (req.user.role === 'admin' || req.user.role === 'hr') {
      // View all leaves
    } else {
      // View only own leaves
      query = query.eq('employeeId', req.user.id);
    }

    const { data: list, error } = await query.order('fromDate', { ascending: false });

    if (error) throw error;

    // Reshape to match old API
    const shaped = (list || []).map(l => ({
      ...l,
      employeeName: l.users?.name || null,
      employeeRole: l.users?.role || null,
      teamId: l.users?.teamId || null,
      employeeCode: l.users?.employeeCode || null
    }));

    return res.json({ leaves: shaped });
  } catch (error) {
    console.error('Get leaves error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/leaves - Apply for a leave
router.post('/', authenticateToken, async (req, res) => {
  const { leaveType, fromDate, toDate, reason } = req.body;

  const validTypes = ['Casual', 'Medical', 'Earned'];
  if (!leaveType || !fromDate || !toDate || !reason) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!validTypes.includes(leaveType)) {
    return res.status(400).json({ message: `Invalid leave type. Must be one of: ${validTypes.join(', ')}` });
  }

  try {
    const { error } = await supabase
      .from('leaves')
      .insert({
        employeeId: req.user.id,
        leaveType,
        fromDate,
        toDate,
        reason,
        status: 'Pending'
      });

    if (error) throw error;
    return res.status(201).json({ message: 'Leave application submitted.' });
  } catch (error) {
    console.error('Apply leave error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/leaves/:id - Approve or reject leave (HR/Admin only)
router.patch('/:id', authenticateToken, requireRoles(['admin', 'hr']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Approved' or 'Rejected'

  if (!status || !['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status update.' });
  }

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('leaves')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    const { error } = await supabase
      .from('leaves')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    return res.json({ message: `Leave request has been ${status.toLowerCase()}.` });
  } catch (error) {
    console.error('Review leave error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
