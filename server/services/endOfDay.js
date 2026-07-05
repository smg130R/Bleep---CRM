const supabase = require('../db/supabase');

async function runEndOfDay() {
  console.log('[EOD] Starting end-of-day process...');
  const today = new Date().toISOString().split('T')[0];
  const results = { naReset: 0, dropped: 0, sheetsUpdated: 0, errors: [] };

  try {
    // ── Step 1: Reset NA leads ──
    const { data: naLeads, error: naErr } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'na');

    if (naErr) {
      results.errors.push('Fetch NA leads: ' + naErr.message);
    } else if (naLeads && naLeads.length > 0) {
      for (const lead of naLeads) {
        const newNaCount = (lead.naCount || 0) + 1;
        if (newNaCount >= 5) {
          await supabase.from('leads').update({ status: 'dropped', naCount: newNaCount, currentAssigneeId: null, updatedAt: today }).eq('id', lead.id);
          await supabase.from('calling_sheet').delete().eq('leadId', lead.id);
          results.dropped++;
        } else {
          await supabase.from('leads').update({ status: 'unassigned', naCount: newNaCount, currentAssigneeId: null, updatedAt: today }).eq('id', lead.id);
          await supabase.from('calling_sheet').delete().eq('leadId', lead.id);
          results.naReset++;
        }
      }
    }

    // ── Step 2: Write to each BDA's assigned sheet ──
    const { data: bdas, error: bdaErr } = await supabase
      .from('users')
      .select('id, name, "assignedSheetUrl", "assignedSheetTab", "prospectSheetUrl", "prospectSheetTab"')
      .eq('role', 'bda')
      .eq('status', 'active');

    if (bdaErr) {
      results.errors.push('Fetch BDAs: ' + bdaErr.message);
    } else if (bdas) {
      const { pushBdaLeadsToSheet, syncBdaProspects, extractSheetId } = require('./sheetsSync');
      for (const bda of bdas) {
        try {
          if (bda.assignedSheetUrl) {
            const sid = extractSheetId(bda.assignedSheetUrl);
            await pushBdaLeadsToSheet(bda.id, sid, bda.assignedSheetTab || 'Sheet1');
            results.sheetsUpdated++;
          }
          if (bda.prospectSheetUrl) {
            const sid = extractSheetId(bda.prospectSheetUrl);
            await syncBdaProspects(bda.id, sid, bda.prospectSheetTab || 'Sheet1');
            results.sheetsUpdated++;
          }
        } catch (e) {
          results.errors.push(`Sheet update for ${bda.name}: ${e.message}`);
        }
      }
    }

    console.log(`[EOD] Complete. NA reset: ${results.naReset}, Dropped: ${results.dropped}, Sheets updated: ${results.sheetsUpdated}, Errors: ${results.errors.length}`);
  } catch (err) {
    console.error('[EOD] Fatal error:', err.message);
    results.errors.push(err.message);
  }

  return results;
}

module.exports = { runEndOfDay };
