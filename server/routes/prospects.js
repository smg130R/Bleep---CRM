const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/prospects - BDA gets own prospects
router.get('/', authenticateToken, requireRoles(['bda', 'team_lead', 'admin']), async (req, res) => {
  try {
    let query = supabase.from('prospects').select('*');

    if (req.user.role === 'bda') {
      query = query.eq('bdaId', req.user.id);
    } else if (req.user.role === 'team_lead') {
      const { data: bdas } = await supabase.from('users').select('id').eq('teamId', req.user.teamId).eq('role', 'bda');
      const ids = (bdas || []).map(b => b.id);
      query = query.in('bdaId', ids.length ? ids : [0]);
    }

    const { data: prospects, error } = await query.order('id', { ascending: false });
    if (error) throw error;

    // Enrich with BDA names for TL/admin
    let bdaMap = {};
    if (['team_lead', 'admin'].includes(req.user.role)) {
      const bdaIds = [...new Set((prospects || []).map(p => p.bdaId))];
      if (bdaIds.length > 0) {
        const { data: bdas } = await supabase.from('users').select('id, name').in('id', bdaIds);
        bdaMap = Object.fromEntries((bdas || []).map(b => [b.id, b.name]));
      }
    }

    const enriched = (prospects || []).map(p => ({
      ...p,
      bdaName: bdaMap[p.bdaId] || null,
    }));

    return res.json({ prospects: enriched });
  } catch (error) {
    console.error('Get prospects error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/prospects - Add a prospect
router.post('/', authenticateToken, requireRoles(['bda', 'team_lead', 'admin']), async (req, res) => {
  const { customerName, contact, email, college, branch, year, domain, month, experience, state, status, remarks, payment_status, slot_amount, amount_paid } = req.body;
  if (!customerName || !contact) {
    return res.status(400).json({ message: 'Customer name and contact are required.' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const slotAmt = parseFloat(slot_amount) || 0;
    const paid = parseFloat(amount_paid) || 0;
    const remaining = Math.max(0, slotAmt - paid);

    const { data, error } = await supabase.from('prospects').insert({
      bdaId: req.user.id,
      customerName,
      contact,
      email: email || '',
      college: college || '',
      branch: branch || '',
      year: year || '',
      domain: domain || '',
      month: month || '',
      experience: experience || '',
      state: state || '',
      status: status || 'Prospect',
      remarks: remarks || '',
      payment_status: payment_status || 'pending',
      slot_amount: slotAmt,
      amount_paid: paid,
      remaining,
      createdAt: today,
      updatedAt: today,
    }).select().single();

    if (error) throw error;
    return res.status(201).json({ prospect: data, message: 'Prospect added.' });
  } catch (error) {
    console.error('Add prospect error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/prospects/:id - Update prospect
router.patch('/:id', authenticateToken, requireRoles(['bda', 'team_lead', 'admin']), async (req, res) => {
  const { id } = req.params;
  const { status, remarks, email, domain, month, experience, state, payment_status, slot_amount, amount_paid, customerName, contact, college, branch, year } = req.body;

  try {
    const today = new Date().toISOString().split('T')[0];
    const updates = { updatedAt: today };
    if (status) updates.status = status;
    if (remarks !== undefined) updates.remarks = remarks;
    if (email !== undefined) updates.email = email;
    if (domain !== undefined) updates.domain = domain;
    if (month !== undefined) updates.month = month;
    if (experience !== undefined) updates.experience = experience;
    if (state !== undefined) updates.state = state;
    if (payment_status !== undefined) updates.payment_status = payment_status;
    if (customerName !== undefined) updates.customerName = customerName;
    if (contact !== undefined) updates.contact = contact;
    if (college !== undefined) updates.college = college;
    if (branch !== undefined) updates.branch = branch;
    if (year !== undefined) updates.year = year;

    if (slot_amount !== undefined || amount_paid !== undefined) {
      // Recalculate remaining
      const { data: existing } = await supabase.from('prospects').select('slot_amount, amount_paid').eq('id', id).limit(1).maybeSingle();
      const newSlot = slot_amount !== undefined ? parseFloat(slot_amount) : (existing?.slot_amount || 0);
      const newPaid = amount_paid !== undefined ? parseFloat(amount_paid) : (existing?.amount_paid || 0);
      updates.slot_amount = newSlot;
      updates.amount_paid = newPaid;
      updates.remaining = Math.max(0, newSlot - newPaid);
    }

    let query = supabase.from('prospects').update(updates).eq('id', id);
    if (req.user.role === 'bda') query = query.eq('bdaId', req.user.id);

    const { error } = await query;
    if (error) throw error;
    return res.json({ message: 'Prospect updated.' });
  } catch (error) {
    console.error('Update prospect error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/prospects/bda-sheets - BDA updates own sheet URLs
router.patch('/bda-sheets', authenticateToken, requireRoles(['bda']), async (req, res) => {
  const { assignedSheetUrl, prospectSheetUrl, assignedSheetTab, prospectSheetTab } = req.body;
  try {
    const updates = {};
    if (assignedSheetUrl !== undefined) updates.assignedSheetUrl = assignedSheetUrl;
    if (prospectSheetUrl !== undefined) updates.prospectSheetUrl = prospectSheetUrl;
    if (assignedSheetTab !== undefined) updates.assignedSheetTab = assignedSheetTab;
    if (prospectSheetTab !== undefined) updates.prospectSheetTab = prospectSheetTab;

    const { error } = await supabase.from('users').update(updates).eq('id', req.user.id);
    if (error) throw error;
    return res.json({ message: 'Sheet config updated.' });
  } catch (error) {
    console.error('Update sheet URLs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/prospects/bda-sheets - BDA gets own sheet URLs
router.get('/bda-sheets', authenticateToken, requireRoles(['bda', 'team_lead', 'admin']), async (req, res) => {
  try {
    const targetId = req.query.userId || req.user.id;
    const { data } = await supabase.from('users').select('id, name, "assignedSheetUrl", "prospectSheetUrl", "assignedSheetTab", "prospectSheetTab"').eq('id', targetId).limit(1).maybeSingle();
    return res.json({ user: data || {} });
  } catch (error) {
    console.error('Get sheet URLs error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/prospects/stats - Payment/collection stats for BDA dashboard
router.get('/stats', authenticateToken, requireRoles(['bda', 'team_lead', 'admin']), async (req, res) => {
  try {
    let query = supabase.from('prospects').select('payment_status, slot_amount, amount_paid, remaining, bdaId');

    if (req.user.role === 'bda') {
      query = query.eq('bdaId', req.user.id);
    } else if (req.user.role === 'team_lead') {
      const { data: bdas } = await supabase.from('users').select('id').eq('teamId', req.user.teamId).eq('role', 'bda');
      const ids = (bdas || []).map(b => b.id);
      query = query.in('bdaId', ids.length ? ids : [0]);
    }

    const { data: prospects, error } = await query;
    if (error) throw error;

    const total = prospects.length;
    const slotBookings = prospects.filter(p => p.payment_status === 'slot_booking' || p.payment_status === 'partial_paid' || p.payment_status === 'fully_paid');
    const totalSlotAmt = slotBookings.reduce((s, p) => s + parseFloat(p.slot_amount || 0), 0);
    const totalPaid = prospects.reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0);
    const totalRemaining = prospects.reduce((s, p) => s + parseFloat(p.remaining || 0), 0);

    return res.json({
      total,
      slotBookingCount: slotBookings.length,
      totalSlotAmount: totalSlotAmt,
      totalCollected: totalPaid,
      totalOutstanding: totalRemaining,
    });
  } catch (error) {
    console.error('Prospect stats error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
