const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// POST /api/complaints - Submit complaint (BDAs only or any authenticated user, but rules say BDA)
router.post('/', authenticateToken, requireRoles(['bda']), async (req, res) => {
  const { recipientRole, subject, details } = req.body;

  if (!recipientRole || !subject || !details) {
    return res.status(400).json({ message: 'recipientRole, subject, and details are required.' });
  }

  if (!['admin', 'hr', 'team_lead'].includes(recipientRole)) {
    return res.status(400).json({ message: 'Invalid recipient role.' });
  }

  try {
    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from('complaints')
      .insert({
        bdaId: req.user.id,
        bdaName: req.user.name,
        recipientRole,
        subject,
        details,
        timestamp,
        status: 'Pending'
      });

    if (error) throw error;
    return res.status(201).json({ message: 'Complaint submitted successfully.' });
  } catch (error) {
    console.error('Submit complaint error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/complaints - Filtered list
// Admin sees ALL. HR sees complaints to HR and Team Lead.
// Others (Team Leads, Operations Head, BDAs) cannot see any.
router.get('/', authenticateToken, requireRoles(['admin', 'hr']), async (req, res) => {
  try {
    let query = supabase.from('complaints').select('*');

    if (req.user.role === 'hr') {
      query = query.in('recipientRole', ['hr', 'team_lead']);
    }
    // Admin sees all

    const { data: complaints, error } = await query.order('timestamp', { ascending: false });

    if (error) throw error;
    return res.json({ complaints });
  } catch (error) {
    console.error('Get complaints error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/complaints/:id - Resolve complaint
router.patch('/:id', authenticateToken, requireRoles(['admin', 'hr']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Pending', 'Resolved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid or missing status.' });
  }

  try {
    // Check if complaint exists and if HR has access to resolve it
    const { data: complaint, error: fetchErr } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    if (req.user.role === 'hr' && !['hr', 'team_lead'].includes(complaint.recipientRole)) {
      return res.status(403).json({ message: 'Unauthorized to resolve this complaint.' });
    }

    const { error: updateErr } = await supabase
      .from('complaints')
      .update({ status })
      .eq('id', id);

    if (updateErr) throw updateErr;
    return res.json({ message: 'Complaint status updated successfully.' });
  } catch (error) {
    console.error('Update complaint error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
