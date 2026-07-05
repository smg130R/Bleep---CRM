// Shared smart field cleanup — auto-detects and fixes swapped/misplaced fields

function smartCleanRow(row) {
  const r = { ...row };

  // ── 1. customerName has email → swap with college or branch ──
  if (r.customerName && r.customerName.includes('@')) {
    if (r.college && !r.college.includes('@') && !/^\d+$/.test(r.college.replace(/\s/g, ''))) {
      [r.customerName, r.college] = [r.college, r.customerName];
    } else if (r.branch && !r.branch.includes('@') && !/^\d+$/.test(r.branch.replace(/\s/g, ''))) {
      [r.customerName, r.branch] = [r.branch, r.customerName];
    }
  }

  // ── 2. contact has email or non-digit → find real phone in other fields ──
  const contactRaw = (r.contact || '').replace(/[\s\-\+\(\)]/g, '');
  if (r.contact && (r.contact.includes('@') || contactRaw.length < 10 || isNaN(Number(contactRaw)))) {
    for (const field of ['college', 'branch', 'year', 'domain', 'email']) {
      const val = (r[field] || '').replace(/[\s\-\+\(\)]/g, '');
      if (val.length >= 10 && !isNaN(Number(val))) {
        [r.contact, r[field]] = [r[field], r.contact];
        break;
      }
    }
  }

  // ── 3. Phone in contact has text mixed in → extract digits only ──
  if (r.contact) {
    const digits = r.contact.replace(/\D/g, '');
    if (digits.length >= 10 && digits !== contactRaw) {
      r.contact = digits;
    }
  }

  // ── 4. college has email + branch has college name → swap college↔branch ──
  if (r.college && r.college.includes('@') && r.branch && !r.branch.includes('@')) {
    const branchDigits = (r.branch || '').replace(/[\s\-\+\(\)]/g, '');
    if (branchDigits.length < 10 || isNaN(Number(branchDigits))) {
      [r.college, r.branch] = [r.branch, r.college];
    }
  }

  // ── 5. branch looks like college, college looks like dept → swap them ──
  const branchLower = (r.branch || '').toLowerCase();
  const collegeLower = (r.college || '').toLowerCase();
  const streamKeywords = ['engineering', 'science', 'technology', 'computer', 'bca', 'bsc', 'bba', 'bcom', 'ba', 'management', 'mechanical', 'civil', 'electrical', 'electronics', 'information', 'cse', 'it', 'aiml', 'ece', 'eee', 'ai', 'data science', 'machine learning', 'artificial intelligence'];
  const collegeKeywords = ['university', 'college', 'institute', 'school', 'academy', 'campus', 'college of'];

  if (collegeLower && branchLower) {
    const branchLooksLikeCollege = collegeKeywords.some(k => branchLower.includes(k));
    const collegeLooksLikeDept = streamKeywords.some(k => collegeLower.includes(k));
    if (branchLooksLikeCollege && collegeLooksLikeDept) {
      [r.college, r.branch] = [r.branch, r.college];
    }
  }

  // ── 6. college has domain keywords + domain has college keywords → swap ──
  const domainLower = (r.domain || '').toLowerCase();
  if (collegeLower && domainLower) {
    const collegeHasDomain = streamKeywords.some(k => collegeLower.includes(k));
    const domainHasCollege = collegeKeywords.some(k => domainLower.includes(k));
    if (collegeHasDomain && domainHasCollege) {
      [r.college, r.domain] = [r.domain, r.college];
    }
  }

  // ── 7. year contains month name, month contains year number → swap ──
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const yearLower = (r.year || '').toLowerCase();
  const monthLower = (r.month || '').toLowerCase();
  if (yearLower && monthLower) {
    const yearHasMonth = monthNames.some(m => yearLower.includes(m));
    const monthHasYearNum = /\b(1st|2nd|3rd|4th|first|second|third|fourth|1|2|3|4)\b/.test(monthLower);
    if (yearHasMonth && monthHasYearNum) {
      [r.year, r.month] = [r.month, r.year];
    }
  }

  // ── 8. state has coding/domain keywords + domain looks like a place → swap ──
  const stateLower = (r.state || '').toLowerCase();
  if (stateLower && domainLower) {
    const stateHasDomain = streamKeywords.some(k => stateLower.includes(k));
    const domainLooksLikeState = !domainLower.includes('@') && domainLower.length <= 20 && !streamKeywords.some(k => domainLower.includes(k)) && !collegeKeywords.some(k => domainLower.includes(k));
    if (stateHasDomain && domainLooksLikeState && domainLower.length > 0) {
      [r.state, r.domain] = [r.domain, r.state];
    }
  }

  // ── 9. Trim whitespace from all string fields ──
  for (const key of Object.keys(r)) {
    if (typeof r[key] === 'string') {
      r[key] = r[key].trim();
    }
  }

  return r;
}

module.exports = { smartCleanRow };
