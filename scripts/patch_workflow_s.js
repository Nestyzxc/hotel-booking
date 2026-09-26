// patch_workflow_s.js — เพิ่ม customers ใน Build Snapshot response
const fs = require('fs');

const path = process.argv[2];
const json = JSON.parse(fs.readFileSync(path, 'utf8'));

// หา node "Build Snapshot" (id: ab1e088d-6e03-5b16-91f8-ead477e30313)
let patched = 0;
for (const node of json.nodes) {
  if (node.id === 'ab1e088d-6e03-5b16-91f8-ead477e30313' && node.parameters && node.parameters.jsCode) {
    const code = node.parameters.jsCode;
    // เพิ่ม customers ก่อน activity: recent(...)
    const oldSnippet = `  promos: S.Promos.map((p) => ({ code: p.code, discount_percent: num(p.discount_percent), valid_until: normDate(p.valid_until),
    active: bool(p.active, true), note: p.note || '' })),
  activity: recent(S.ActivityLog, 200),`;

    const newSnippet = `  promos: S.Promos.map((p) => ({ code: p.code, discount_percent: num(p.discount_percent), valid_until: normDate(p.valid_until),
    active: bool(p.active, true), note: p.note || '' })),
  customers: S.Customers.filter((c) => c.line_user_id).map((c) => ({
    line_user_id: c.line_user_id, first_seen_at: c.first_seen_at || '', last_seen_at: c.last_seen_at || '',
    full_name: c.full_name || '', phone: c.phone || '', email: c.email || '',
    total_stays: num(c.total_stays), total_nights: num(c.total_nights), lifetime_value: num(c.lifetime_value),
    last_preference_tags: c.last_preference_tags || '', marketing_opt_out: bool(c.marketing_opt_out, false), notes: c.notes || '',
  })).sort((a, b) => (b.last_seen_at || '').localeCompare(a.last_seen_at || '')),
  activity: recent(S.ActivityLog, 200),`;

    if (code.includes(oldSnippet)) {
      node.parameters.jsCode = code.replace(oldSnippet, newSnippet);
      patched++;
      console.log('Patched Build Snapshot in', path);
    } else {
      console.log('ERROR: Build Snapshot snippet not found in', path);
      // debug: print 200 chars around "activity:"
      const idx = code.indexOf('activity: recent');
      if (idx >= 0) console.log('Context around "activity:":', JSON.stringify(code.slice(Math.max(0, idx - 250), idx + 60)));
    }
  }
}

if (patched > 0) {
  fs.writeFileSync(path, JSON.stringify(json, null, 2));
  console.log('Saved', path);
}
