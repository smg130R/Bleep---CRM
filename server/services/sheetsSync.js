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
  const sheets = await getSheetsClient();
  if (!sheets || !spreadsheetId) {
    console.log(`[Simulated] Syncing assigned leads sheet for user ${userId}`);
    return true;
  }
  try {
    const range = tab ? `${tab}!A2:G100` : 'Sheet1!A2:G100';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return false;

    const today = new Date().toISOString().split('T')[0];
    await supabase.from('calling_sheet').delete().eq('assignedUserId', userId);

    for (const row of rows) {
      const [name, phone, college, branch, year, status, remarks] = row;
      if (!name || !phone) continue;
      await supabase.from('calling_sheet').insert({
        assignedUserId: userId,
        customerName: name,
        contact: phone,
        college: college || '',
        branch: branch || '',
        year: year || '',
        status: status || 'Pending',
        remarks: remarks || '',
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
  const sheets = await getSheetsClient();
  if (!sheets || !spreadsheetId) {
    console.log(`[Simulated] Syncing prospect sheet for user ${userId}`);
    return true;
  }
  try {
    const range = tab ? `${tab}!A2:H100` : 'Sheet1!A2:H100';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return false;

    const today = new Date().toISOString().split('T')[0];
    await supabase.from('prospects').delete().eq('bdaId', userId);

    for (const row of rows) {
      const [name, phone, college, branch, year, status, remarks] = row;
      if (!name || !phone) continue;
      await supabase.from('prospects').insert({
        bdaId: userId,
        customerName: name,
        contact: phone,
        college: college || '',
        branch: branch || '',
        year: year || '',
        status: status || 'Prospect',
        remarks: remarks || '',
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
  const sheets = await getSheetsClient();
  if (!sheets || !spreadsheetId) {
    console.log('[Simulated] Reading master sheet for import');
    return [];
  }
  try {
    const range = `${tab}!A2:E1000`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in master sheet');
      return [];
    }

    const leads = rows.map(row => ({
      customerName: (row[0] || '').trim(),
      contact: (row[1] || '').trim(),
      college: (row[2] || '').trim(),
      branch: (row[3] || '').trim(),
      year: (row[4] || '').trim(),
    })).filter(l => l.customerName && l.contact);

    console.log(`Read ${leads.length} leads from master sheet`);
    return leads;
  } catch (error) {
    console.error('Error reading master sheet:', error.message);
    throw error;
  }
}

module.exports = { startCronScheduler, runAllSyncs, syncBdaSheet, syncBdaProspects, pushBdaLeadsToSheet, extractSheetId, importLeadsFromMasterSheet };
