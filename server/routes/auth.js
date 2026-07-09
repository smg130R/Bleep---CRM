const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config');
const supabase = require('../db/supabase');
const { authenticateToken } = require('../middleware/auth');

async function findUserByAuthId(authId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('authId', authId)
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

async function findUserByAuthIdFull(authId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('authId', authId)
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

async function findUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, phone, teamId, joinedDate')
    .eq('id', id)
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();

    // Authenticate via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (authError) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Look up the user in our public.users table via authId
    const user = await findUserByAuthId(authData.user.id);

    if (!user) {
      return res.status(500).json({ message: 'User account not found.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is suspended.' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
      phone: user.phone,
      joinedDate: user.joinedDate
    };

    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '8h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000
    });

    return res.json({ message: 'Login successful', user: payload });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/sso
router.post('/sso', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ message: 'Access token is required.' });
  }

  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser(access_token);
    if (error || !authUser) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    let user = await findUserByAuthId(authUser.id);

    if (!user) {
      const email = authUser.email;
      const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0];
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          name,
          email,
          role: 'bda',
          status: 'active',
          authId: authUser.id,
        }])
        .select()
        .single();
      if (createError) throw createError;
      user = newUser;
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is suspended.' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
      phone: user.phone,
      joinedDate: user.joinedDate,
    };

    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '8h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000,
    });

    return res.json({ message: 'Login successful', user: payload });
  } catch (error) {
    console.error('SSO error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
  return res.json({ message: 'Logout successful' });
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { name, phone, dob } = req.body;
  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (dob !== undefined) updates.dob = dob;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, name, email, role, phone, teamId, joinedDate')
      .single();

    if (error) throw error;
    return res.json({ message: 'Profile updated', user: data });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/auth/change-password - Change password via Supabase Auth
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }
  try {
    const userRecord = await findUserByAuthIdFull(req.user.id);
    if (!userRecord || !userRecord.authId) {
      return res.status(400).json({ message: 'Password change not available for this account type.' });
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return res.status(400).json({ message: error.message });
    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
