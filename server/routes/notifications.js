const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// GET /api/notifications - Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', req.user.id)
      .order('id', { ascending: false })
      .limit(50);

    if (error) throw error;
    const unread = (data || []).filter(n => !n.isRead).length;
    return res.json({ notifications: data || [], unread });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/notifications - Create a notification
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId, title, body, type, linkTo } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ message: 'userId, title, and body are required.' });
    }

    const { data, error } = await supabase.from('notifications').insert({
      userId,
      title,
      body,
      type: type || 'info',
      linkTo: linkTo || null,
      createdAt: new Date().toISOString(),
    }).select().single();

    if (error) throw error;
    return res.json({ notification: data });
  } catch (error) {
    console.error('Create notification error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await supabase.from('notifications').update({ isRead: true }).eq('userId', req.user.id).eq('isRead', false);
    return res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/notifications/:id/read - Mark one as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    await supabase.from('notifications').update({ isRead: true }).eq('id', req.params.id).eq('userId', req.user.id);
    return res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/notifications/ping-bda - TL/Admin/HR pings a BDA for low performance
router.post('/ping-bda', authenticateToken, requireRoles(['admin', 'team_lead', 'ops_head', 'hr']), async (req, res) => {
  try {
    const { bdaId, message } = req.body;
    if (!bdaId) return res.status(400).json({ message: 'BDA ID is required.' });

    const { data: bda } = await supabase.from('users').select('id, name, teamId').eq('id', bdaId).single();
    if (!bda) return res.status(400).json({ message: 'BDA not found.' });

    const now = new Date().toISOString();

    // Notify the BDA
    const { data: notif, error } = await supabase.from('notifications').insert({
      userId: bdaId,
      title: 'Performance Alert',
      body: message || `${req.user.name} pinged you about low performance. Please check your KPIs.`,
      type: 'ping',
      createdAt: now,
    }).select().single();

    if (error) throw error;

    // Also notify the BDA's team lead
    let tlNotif = null;
    if (bda.teamId) {
      const { data: tls } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'team_lead')
        .eq('teamId', bda.teamId);

      if (tls && tls.length > 0) {
        const tlIds = tls.map(t => t.id);
        const tlInserts = tlIds.map(tlId => ({
          userId: tlId,
          title: 'BDA Performance Alert',
          body: `${bda.name} from your team has been flagged for low performance by ${req.user.name}.`,
          type: 'warning',
          createdAt: now,
        }));
        const { data: tlNotifs } = await supabase.from('notifications').insert(tlInserts).select();
        tlNotif = tlNotifs;
      }
    }

    return res.json({
      message: `Ping sent to ${bda.name}${tlNotif ? ' and their Team Lead.' : '.'}`,
      notification: notif,
      tlNotification: tlNotif,
    });
  } catch (error) {
    console.error('Ping BDA error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
