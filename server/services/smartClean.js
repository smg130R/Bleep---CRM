function smartCleanRow(row) {
  const r = { ...row };

  const streamKeywords = ['engineering', 'science', 'technology', 'computer', 'bca', 'bsc', 'bba', 'bcom', 'ba', 'management', 'mechanical', 'civil', 'electrical', 'electronics', 'information', 'cse', 'it', 'aiml', 'ece', 'eee', 'ai', 'data science', 'machine learning', 'artificial intelligence'];
  const collegeKeywords = ['university', 'college', 'institute', 'school', 'academy', 'campus', 'college of'];

  // ── 1. customerName has email → swap with college or branch ──
  if (r.customerName && r.customerName.includes('@')) {
    if (r.college && !r.college.includes('@') && !/^\d+$/.test(r.college.replace(/\s/g, ''))) {
      [r.customerName, r.college] = [r.college, r.customerName];
    } else if (r.branch && !r.branch.includes('@') && !/^\d+$/.test(r.branch.replace(/\s/g, ''))) {
      [r.customerName, r.branch] = [r.branch, r.customerName];
    } else if (r.email && !r.email.includes('@')) {
      [r.customerName, r.email] = [r.email, r.customerName];
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

  // ── 10. customerName has year/class/semester keywords → swap with year ──
  if (r.customerName && r.year && !r.customerName.includes('@')) {
    const nameLower = r.customerName.toLowerCase();
    const yearKw = /\b(\d{1,2}(st|nd|rd|th)\s*year|year\s*\d{1,2}|sem\s*\d{1,2}|semester\s*\d{1,2}|bca\s*\d{1,2}|btech\s*\d{1,2}|bcom\s*\d{1,2}|bba\s*\d{1,2}|bsc\s*\d{1,2}|b\.\s*\w+\s*\d)\b/;
    const nameHasYear = yearKw.test(nameLower);
    const yearHasYear = yearKw.test(yearLower);
    if (nameHasYear && !yearHasYear) {
      [r.customerName, r.year] = [r.year, r.customerName];
    }
  }

  // ── 11. college looks like a person's name (not institution) → swap with customerName ──
  if (r.college && r.customerName && !r.college.includes('@') && !r.customerName.includes('@')) {
    const cl = r.college.toLowerCase();
    const cn = r.customerName.toLowerCase();
    const collegeLooksReal = collegeKeywords.some(k => cl.includes(k)) || streamKeywords.some(k => cl.includes(k));
    const nameLooksReal = collegeKeywords.some(k => cn.includes(k)) || streamKeywords.some(k => cn.includes(k));
    if (!collegeLooksReal && nameLooksReal) {
      [r.customerName, r.college] = [r.college, r.customerName];
    }
  }

  // ── 12. branch has email → swap with email field ──
  if (r.branch && r.branch.includes('@') && r.email && !r.email.includes('@')) {
    [r.branch, r.email] = [r.email, r.branch];
  }
  // Also check if branch has email but email field is missing/empty
  if (r.branch && r.branch.includes('@') && (!r.email || r.email === '')) {
    r.email = r.branch;
    r.branch = '';
  }

  // ── 13. customerName looks like an institution → swap with college ──
  if (r.customerName && r.college && !r.customerName.includes('@') && !r.college.includes('@')) {
    const cn2 = r.customerName.toLowerCase();
    const cl2 = r.college.toLowerCase();
    const nameIsInstitution = collegeKeywords.some(k => cn2.includes(k)) || streamKeywords.some(k => cn2.includes(k));
    const collegeIsNot = !collegeKeywords.some(k => cl2.includes(k)) && !streamKeywords.some(k => cl2.includes(k));
    if (nameIsInstitution && collegeIsNot) {
      [r.customerName, r.college] = [r.college, r.customerName];
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
