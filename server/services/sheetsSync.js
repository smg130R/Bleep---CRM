const cron = require('node-cron');
const { google } = require('googleapis');
const supabase = require('../db/supabase');

async function getSheetsClient() {
  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let saKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!saEmail || !saKey) {
    console.warn('Google Sheets Credentials missing. Sync running in simulated mode.');
    return null;
  }
  saKey = saKey.replace(/\\n/g, '\n');
  const auth = new google.auth.JWT({ email: saEmail, key: saKey, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

// Sync a BDA's assigned leads sheet into calling_sheet
async function syncBdaSheet(userId, spreadsheetId, tab) {
  let sheets;
  try {
    sheets = await getSheetsClient();
  } catch (e) {
    console.error(`Failed to init Sheets client for BDA ${userId}:`, e.message);
    return false;
  }
  if (!sheets || !spreadsheetId) {
    console.log(`[Simulated] Syncing assigned leads sheet for user ${userId}`);
    return true;
  }
  try {
    const range = tab ? `${tab}!A1:Z100` : 'Sheet1!A1:Z100';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return false;

    const parsed = parseRowsWithHeaders(rows);
    if (parsed.length === 0) return false;

    const today = new Date().toISOString().split('T')[0];
    await supabase.from('calling_sheet').delete().eq('assignedUserId', userId);

    for (const lead of parsed) {
      await supabase.from('calling_sheet').insert({
        assignedUserId: userId,
        customerName: lead.customerName,
        contact: lead.contact,
        college: lead.college || '',
        branch: lead.branch || '',
        year: lead.year || '',
        status: 'Pending',
        remarks: '',
        lastUpdated: today,
      });
    }
    console.log(`Assigned leads synced for BDA ${userId} (tab: ${tab || 'Sheet1'})`);
    return true;
  } catch (error) {
    console.error(`Error syncing BDA ${userId} assigned sheet:`, error.message);
    return false;
  }
}

// Sync a BDA's prospect sheet into prospects table
async function syncBdaProspects(userId, spreadsheetId, tab) {
  let sheets;
  try {
    sheets = await getSheetsClient();
  } catch (e) {
    console.error(`Failed to init Sheets client for BDA ${userId}:`, e.message);
    return false;
  }
  if (!sheets || !spreadsheetId) {
    console.log(`[Simulated] Syncing prospect sheet for user ${userId}`);
    return true;
  }
  try {
    const range = tab ? `${tab}!A1:Z100` : 'Sheet1!A1:Z100';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return false;

    const parsed = parseRowsWithHeaders(rows);
    if (parsed.length === 0) return false;

    const today = new Date().toISOString().split('T')[0];
    await supabase.from('prospects').delete().eq('bdaId', userId);

    for (const lead of parsed) {
      await supabase.from('prospects').insert({
        bdaId: userId,
        customerName: lead.customerName,
        contact: lead.contact,
        email: lead.email || '',
        college: lead.college || '',
        branch: lead.branch || '',
        year: lead.year || '',
        domain: lead.domain || '',
        month: lead.month || '',
        experience: lead.experience || '',
        state: lead.state || '',
        status: lead.status || 'Prospect',
        payment_status: lead.payment_status || 'pending',
        slot_amount: lead.slot_amount || 0,
        amount_paid: lead.amount_paid || 0,
        remaining: lead.remaining || 0,
        remarks: lead.remarks || '',
        createdAt: today,
        updatedAt: today,
      });
    }
    console.log(`Prospect sheet synced for BDA ${userId} (tab: ${tab || 'Sheet1'})`);
    return true;
  } catch (error) {
    console.error(`Error syncing BDA ${userId} prospect sheet:`, error.message);
    return false;
  }
}

// Sync all BDAs (both sheets)
async function runAllSyncs() {
  console.log('--- Google Sheets Sync Job ---');
  try {
    const { data: bdas, error } = await supabase
      .from('users')
      .select('id, name, "assignedSheetUrl", "prospectSheetUrl", "assignedSheetTab", "prospectSheetTab"')
      .eq('role', 'bda');

    if (error) throw error;
    if (!bdas || bdas.length === 0) {
      console.log('No BDAs found for sync.');
      return;
    }

    for (const bda of bdas) {
      if (bda.assignedSheetUrl) {
        const sid = extractSheetId(bda.assignedSheetUrl);
        await syncBdaSheet(bda.id, sid, bda.assignedSheetTab);
      }
      if (bda.prospectSheetUrl) {
        const sid = extractSheetId(bda.prospectSheetUrl);
        await syncBdaProspects(bda.id, sid, bda.prospectSheetTab);
      }
    }
    console.log('Sync complete.');
  } catch (err) {
    console.error('Sync job failed:', err);
  }
}

// Smart column mapping: detect columns by header name
const COLUMN_ALIASES = {
  customerName: ['name', 'customer name', 'customer', 'student name', 'student', 'full name', 'candidate name', 'candidate', 'prospect name', 'prospect'],
  contact: ['contact', 'contact number', 'phone', 'phone number', 'mobile', 'mobile number', 'whatsapp', 'whatsapp number', 'cell', 'number', 'tel', 'telephone'],
  email: ['email', 'email id', 'e mail id', 'e mail', 'email address', 'mail', 'mail id'],
  college: ['college', 'college name', 'institute', 'university', 'school', 'institution', 'academic institute'],
  branch: ['branch', 'branch department', 'stream', 'course', 'department', 'major', 'specialization', 'discipline', 'field'],
  year: ['year', 'year of study', 'academic year', 'semester', 'class', 'study year', 'current year', 'year sem'],
  domain: ['domain', 'domains offered', 'domain offered', 'preferred domain', 'domains', 'domain choosed', 'domain chosen', 'course domain', 'chosen domain', 'area of interest'],
  month: ['month', 'preferred month of joining', 'month of joining', 'joining month', 'start month', 'batch month'],
  experience: ['experience', 'experience level', 'years of experience', 'work experience', 'exp', 'previous experience'],
  state: ['state', 'home state', 'location', 'city', 'region', 'province', 'address state'],
  status: ['status', 'stage', 'pipeline stage', 'current status', 'lead status', 'call status', 'prospect status'],
  payment_status: ['payment status', 'payment', 'fee status', 'payment stage', 'billing status'],
  slot_amount: ['slot amount', 'slot booking amount', 'booking amount', 'registration fee', 'slot fee'],
  amount_paid: ['amount paid', 'paid amount', 'paid', 'payment made', 'total paid'],
  remaining: ['remaining', 'remaining amount', 'balance', 'due amount', 'outstanding'],
  remarks: ['remarks', 'remark', 'notes', 'note', 'comment', 'comments', 'feedback', 'observation', 'observations', 'note to self'],
};

function normalizeHeader(h) {
  return (h || '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
}

function detectColumnMap(headers) {
  // Build flat list of (field, normalizedAlias) sorted by length descending
  const sorted = [];
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      sorted.push({ field, norm: normalizeHeader(alias) });
    }
  }
  sorted.sort((a, b) => b.norm.length - a.norm.length);

  const map = {};
  for (let i = 0; i < headers.length; i++) {
    const h = normalizeHeader(headers[i]);
    if (!h) continue;
    for (const { field, norm } of sorted) {
      if (norm.length < 3) continue;
      if (h.includes(norm)) {
        // Only map this field if not already assigned
        if (map[field] === undefined) {
          map[field] = i;
        }
        break;
      }
    }
  }
  return map;
}

function parseRowsWithHeaders(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  const map = detectColumnMap(headers);
  if (map.customerName === undefined || map.contact === undefined) {
    console.warn('Could not detect required columns (Name, Contact). Found headers:', headers.join(', '));
    return [];
  }

  return rows.slice(1).map(row => ({
    customerName: (row[map.customerName] || '').trim(),
    contact: (row[map.contact] || '').trim(),
    email: map.email !== undefined ? (row[map.email] || '').trim() : '',
    college: map.college !== undefined ? (row[map.college] || '').trim() : '',
    branch: map.branch !== undefined ? (row[map.branch] || '').trim() : '',
    year: map.year !== undefined ? (row[map.year] || '').trim() : '',
    domain: map.domain !== undefined ? (row[map.domain] || '').trim() : '',
    month: map.month !== undefined ? (row[map.month] || '').trim() : '',
    experience: map.experience !== undefined ? (row[map.experience] || '').trim() : '',
    state: map.state !== undefined ? (row[map.state] || '').trim() : '',
    status: map.status !== undefined ? (row[map.status] || '').trim() : '',
    payment_status: map.payment_status !== undefined ? (row[map.payment_status] || '').trim() : '',
    slot_amount: map.slot_amount !== undefined ? parseFloat(row[map.slot_amount]) || 0 : 0,
    amount_paid: map.amount_paid !== undefined ? parseFloat(row[map.amount_paid]) || 0 : 0,
    remaining: map.remaining !== undefined ? parseFloat(row[map.remaining]) || 0 : 0,
    remarks: map.remarks !== undefined ? (row[map.remarks] || '').trim() : '',
  })).filter(l => l.customerName && l.contact);
}

// Extract spreadsheet ID from a Google Sheets URL
function extractSheetId(url) {
  if (!url) return null;
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : url; // fallback: treat as raw ID
}

function startCronScheduler() {
  console.log('Initializing Google Sheets cron scheduler...');
  cron.schedule('30 14 * * *', () => { console.log('Running 2:30 PM sync...'); runAllSyncs(); });
  cron.schedule('30 17 * * *', () => { console.log('Running 5:30 PM sync...'); runAllSyncs(); });
  console.log('Cron set for 2:30 PM and 5:30 PM daily.');
}

// Push a BDA's calling_sheet leads to their Google Sheet tab
async function pushBdaLeadsToSheet(userId, spreadsheetId, tab) {
  const sheets = await getSheetsClient();
  if (!sheets || !spreadsheetId) {
    console.log(`[Simulated] Pushing assigned leads for user ${userId}`);
    return true;
  }
  try {
    const { data: leads } = await supabase
      .from('calling_sheet')
      .select('customerName, contact, college, branch, year, status, remarks')
      .eq('assignedUserId', userId)
      .order('id');

    if (!leads || leads.length === 0) {
      console.log(`No leads to push for BDA ${userId}`);
      return false;
    }

    const headers = [['Name', 'Contact', 'College', 'Branch', 'Year', 'Status', 'Remarks']];
    const rows = leads.map(l => [
      l.customerName, l.contact, l.college || '', l.branch || '', l.year || '',
      l.status || 'Pending', l.remarks || ''
    ]);
    const values = headers.concat(rows);

    const range = tab ? tab + '!A1:G' + values.length : 'Sheet1!A1:G' + values.length;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    console.log(`Pushed ${leads.length} leads to BDA ${userId} sheet (tab: ${tab || 'Sheet1'})`);
    return true;
  } catch (error) {
    console.error(`Error pushing leads for BDA ${userId}:`, error.message);
    return false;
  }
}

// Import leads from a team's master Google Sheet into the leads table
async function importLeadsFromMasterSheet(spreadsheetId, tab = 'Sheet1') {
  let sheets;
  try {
    sheets = await getSheetsClient();
  } catch (e) {
    console.error('Failed to init Sheets client for master import:', e.message);
    return [];
  }
  if (!sheets || !spreadsheetId) {
    console.log('[Simulated] Reading master sheet for import');
    return [];
  }
  try {
    const range = `${tab}!A1:Z1000`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in master sheet');
      return [];
    }

    const leads = parseRowsWithHeaders(rows);
    console.log(`Read ${leads.length} leads from master sheet`);
    return leads;
  } catch (error) {
    console.error('Error reading master sheet:', error.message);
    throw error;
  }
}

module.exports = { startCronScheduler, runAllSyncs, syncBdaSheet, syncBdaProspects, pushBdaLeadsToSheet, extractSheetId, importLeadsFromMasterSheet, parseRowsWithHeaders };
