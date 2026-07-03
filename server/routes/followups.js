const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken } = require('../middleware/auth');

// GET /api/followups - Get all followups for the logged-in BDA
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('followups').select('*, users(name)');

    if (req.user.role === 'bda') {
      query = query.eq('bdaId', req.user.id);
    } else if (req.user.role === 'team_lead') {
      // Get followups for BDAs in this team
      query = query.eq('users.teamId', req.user.teamId);
    }
    // Admin/hr can see all

    const { data: list, error } = await query.order('date', { ascending: true });

    if (error) throw error;

    // Reshape to match old API
    const shaped = (list || []).map(f => ({
      ...f,
      bdaName: f.users?.name || null
    }));

    return res.json({ followups: shaped });
  } catch (error) {
    console.error('Get followups error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/followups - Add a new follow-up record
router.post('/', authenticateToken, async (req, res) => {
  const { customerName, contact, college, date, priority, remarks } = req.body;

  if (!customerName || !contact || !date) {
    return res.status(400).json({ message: 'Customer name, contact number, and date are required.' });
  }

  try {
    const { error } = await supabase
      .from('followups')
      .insert({
        bdaId: req.user.id,
        customerName,
        contact,
        college: college || null,
        date,
        priority: priority || 'Medium',
        status: 'Pending',
        remarks: remarks || null
      });

    if (error) throw error;
    return res.status(201).json({ message: 'Follow-up created successfully.' });
  } catch (error) {
    console.error('Create followup error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/followups/:id - Update status/remarks
router.patch('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  try {
    const { error } = await supabase
      .from('followups')
      .update({
        status,
        remarks: remarks || ''
      })
      .eq('id', id);

    if (error) throw error;
    return res.json({ message: 'Follow-up status updated.' });
  } catch (error) {
    console.error('Update followup error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
