const DEBUG = process.env.SMART_CLEAN_DEBUG === 'true';

function log(...args) {
  if (DEBUG) console.log('[SmartClean]', ...args);
}

function smartCleanRow(row) {
  const r = { ...row };

  const streamKeywords = ['engineering', 'science', 'technology', 'computer', 'bca', 'bsc', 'bba', 'bcom', 'ba', 'management', 'mechanical', 'civil', 'electrical', 'electronics', 'information', 'cse', 'it', 'aiml', 'ece', 'eee', 'ai', 'data science', 'machine learning', 'artificial intelligence'];
  const collegeKeywords = ['university', 'college', 'institute', 'school', 'academy', 'campus', 'college of'];
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  const nameLower = (r.customerName || '').toLowerCase();
  const collegeLower = (r.college || '').toLowerCase();
  const branchLower = (r.branch || '').toLowerCase();
  const yearLower = (r.year || '').toLowerCase();
  const monthLower = (r.month || '').toLowerCase();
  const domainLower = (r.domain || '').toLowerCase();
  const stateLower = (r.state || '').toLowerCase();

  let changed = false;

  const yearKw = /\b(\d{1,2}(st|nd|rd|th)\s*(year|sem|semester)|year\s*\d{1,2}|sem\s*\d{1,2}|semester\s*\d{1,2}|bca\s*\d{1,2}|btech\s*\d{1,2}|bcom\s*\d{1,2}|bba\s*\d{1,2}|bsc\s*\d{1,2}|class\s*\d{1,2})\b/;

  // Helper to swap two fields
  const swap = (a, b) => { [r[a], r[b]] = [r[b], r[a]]; changed = true; log(`Swapped ${a} ↔ ${b}`, r[a], r[b]); };

  // ── 1. customerName has email → swap with college or branch ──
  if (r.customerName && r.customerName.includes('@')) {
    if (r.college && !r.college.includes('@') && !/^\d+$/.test(r.college.replace(/\s/g, ''))) {
      swap('customerName', 'college');
    } else if (r.branch && !r.branch.includes('@') && !/^\d+$/.test(r.branch.replace(/\s/g, ''))) {
      swap('customerName', 'branch');
    } else if (r.email && !r.email.includes('@')) {
      swap('customerName', 'email');
    }
  }

  // ── 2. contact has email or non-digit → find real phone in other fields ──
  const contactRaw = (r.contact || '').replace(/[\s\-\+\(\)]/g, '');
  if (r.contact && (r.contact.includes('@') || contactRaw.length < 10 || isNaN(Number(contactRaw)))) {
    for (const field of ['college', 'branch', 'year', 'domain', 'email']) {
      const val = (r[field] || '').replace(/[\s\-\+\(\)]/g, '');
      if (val.length >= 10 && !isNaN(Number(val))) {
        swap('contact', field);
        break;
      }
    }
  }

  // ── 3. Phone in contact has text mixed in → extract digits only ──
  if (r.contact) {
    const digits = r.contact.replace(/\D/g, '');
    if (digits.length >= 10 && digits !== contactRaw) {
      r.contact = digits;
      changed = true;
      log('Extracted phone digits from contact');
    }
  }

  // ── 4. college has email + branch has college name → swap ──
  if (r.college && r.college.includes('@') && r.branch && !r.branch.includes('@')) {
    const branchDigits = (r.branch || '').replace(/[\s\-\+\(\)]/g, '');
    if (branchDigits.length < 10 || isNaN(Number(branchDigits))) {
      swap('college', 'branch');
    }
  }

  // ── 5. branch looks like college, college looks like dept → swap ──
  if (collegeLower && branchLower) {
    const branchLooksLikeCollege = collegeKeywords.some(k => branchLower.includes(k));
    const collegeLooksLikeDept = streamKeywords.some(k => collegeLower.includes(k));
    if (branchLooksLikeCollege && collegeLooksLikeDept) {
      swap('college', 'branch');
    }
  }

  // ── 6. college has domain keywords + domain has college keywords → swap ──
  if (collegeLower && domainLower) {
    const collegeHasDomain = streamKeywords.some(k => collegeLower.includes(k));
    const domainHasCollege = collegeKeywords.some(k => domainLower.includes(k));
    if (collegeHasDomain && domainHasCollege) {
      swap('college', 'domain');
    }
  }

  // ── 7. year has month name, month has year number → swap ──
  if (yearLower && monthLower) {
    const yearHasMonth = monthNames.some(m => yearLower.includes(m));
    const monthHasYearNum = /\b(1st|2nd|3rd|4th|first|second|third|fourth|1|2|3|4)\b/.test(monthLower);
    if (yearHasMonth && monthHasYearNum) {
      swap('year', 'month');
    }
  }

  // ── 8. state has domain keywords + domain looks like a place → swap ──
  if (stateLower && domainLower) {
    const stateHasDomain = streamKeywords.some(k => stateLower.includes(k));
    const domainLooksLikeState = !domainLower.includes('@') && domainLower.length <= 20 && !streamKeywords.some(k => domainLower.includes(k)) && !collegeKeywords.some(k => domainLower.includes(k));
    if (stateHasDomain && domainLooksLikeState && domainLower.length > 0) {
      swap('state', 'domain');
    }
  }

  // ── 10. customerName has year/class/semester keywords → swap with year ──
  if (r.customerName && r.year && !r.customerName.includes('@') && !r.year.includes('@')) {
    const nameHasYear = yearKw.test(nameLower);
    const yearHasYear = yearKw.test(yearLower);
    if (nameHasYear && !yearHasYear) {
      swap('customerName', 'year');
    }
  }

  // ── 11. college looks like a person's name (not institution) → swap with customerName ──
  if (r.college && r.customerName && !r.college.includes('@') && !r.customerName.includes('@')) {
    const collegeLooksReal = collegeKeywords.some(k => collegeLower.includes(k)) || streamKeywords.some(k => collegeLower.includes(k));
    const nameLooksReal = collegeKeywords.some(k => nameLower.includes(k)) || streamKeywords.some(k => nameLower.includes(k));
    if (!collegeLooksReal && nameLooksReal) {
      swap('customerName', 'college');
    }
  }

  // ── 12. branch has email → swap with email field if exists, else try other fields ──
  if (r.branch && r.branch.includes('@')) {
    if (r.email && !r.email.includes('@')) {
      swap('branch', 'email');
    } else if (r.year && !r.year.includes('@') && !yearKw.test(r.year) && !/\d/.test(r.year.replace(/[\s\-\+\(\)]/g, ''))) {
      // year looks like a name → branch(has email) and year has the real branch
      swap('branch', 'year');
    } else if (r.college && !r.college.includes('@') && !collegeKeywords.some(k => r.college.toLowerCase().includes(k)) && !streamKeywords.some(k => r.college.toLowerCase().includes(k))) {
      // college doesn't look like institution → branch(has email) and college has the real branch
      swap('branch', 'college');
    } else {
      // Nowhere to put it — just clear branch
      log('Email found in branch, no target field — clearing branch');
      r.branch = '';
      changed = true;
    }
  }

  // ── 13. customerName looks like an institution → swap with college ──
  if (r.customerName && r.college && !r.customerName.includes('@') && !r.college.includes('@')) {
    const nameIsInstitution = collegeKeywords.some(k => nameLower.includes(k)) || streamKeywords.some(k => nameLower.includes(k));
    const collegeIsNot = !collegeKeywords.some(k => collegeLower.includes(k)) && !streamKeywords.some(k => collegeLower.includes(k));
    if (nameIsInstitution && collegeIsNot) {
      swap('customerName', 'college');
    }
  }

  // ── 14. Trim whitespace from all string fields ──
  for (const key of Object.keys(r)) {
    if (typeof r[key] === 'string') {
      const trimmed = r[key].trim();
      if (trimmed !== r[key]) { r[key] = trimmed; changed = true; }
    }
  }

  if (DEBUG && changed) log('Result:', JSON.stringify(r));
  return r;
}

module.exports = { smartCleanRow };
