// rename-nodes.js — เปลี่ยนชื่อ node ทุก workflow ตามตาราง scripts/node-names.json (แนวเดียวกับคลิปแนะนำระบบ)
//
//   node scripts/rename-nodes.js              → อ่าน workflow-*.json จากโฟลเดอร์หลัก เขียนไฟล์ใหม่ลง renamed/
//   node scripts/rename-nodes.js --check      → ตรวจอย่างเดียว ไม่เขียนไฟล์
//
// สิ่งที่เปลี่ยนให้ครบ (n8n ผูกทุกอย่างด้วย "ชื่อ node"):
//   1. nodes[].name
//   2. connections: key ต้นทาง และ node ปลายทางทุกสาย
//   3. pinData: key
//   4. expression ที่อ้างชื่อ node ใน parameters/โค้ด: $('ชื่อ')  $("ชื่อ")  $node["ชื่อ"]  $node['ชื่อ']  $items("ชื่อ")  $items('ชื่อ')
//   5. ใน Code node: สตริง 'ชื่อ node' ที่ถูกเก็บไว้ในตัวแปรแล้วค่อยเรียก $(n) ทีหลัง (เช่น Collect Result ของ workflow S)
//      — เปลี่ยนเฉพาะสตริงที่ตรงกับชื่อเก่าทั้งคำ และพิมพ์รายการให้ตรวจ
// ไฟล์ต้นฉบับไม่ถูกแตะ — นำไฟล์ใน renamed/ ไป Import ใน n8n (Workflow menu → Import from File)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'renamed');
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'node-names.json'), 'utf8'));
const CHECK_ONLY = process.argv.includes('--check');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// pattern ของ expression ที่อ้างชื่อ node (ทั้งใน parameters และใน jsCode)
function refPatterns(oldName) {
  const n = esc(oldName);
  return [
    [new RegExp(`\\$\\(\\s*'${n}'\\s*\\)`, 'g'), (nw) => `$('${nw}')`],
    [new RegExp(`\\$\\(\\s*"${n}"\\s*\\)`, 'g'), (nw) => `$("${nw}")`],
    [new RegExp(`\\$node\\[\\s*"${n}"\\s*\\]`, 'g'), (nw) => `$node["${nw}"]`],
    [new RegExp(`\\$node\\[\\s*'${n}'\\s*\\]`, 'g'), (nw) => `$node['${nw}']`],
    [new RegExp(`\\$items\\(\\s*"${n}"`, 'g'), (nw) => `$items("${nw}"`],
    [new RegExp(`\\$items\\(\\s*'${n}'`, 'g'), (nw) => `$items('${nw}'`],
  ];
}

function walkStrings(value, fn) {
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) return value.map((v) => walkStrings(v, fn));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = walkStrings(v, fn);
    return out;
  }
  return value;
}

function renameWorkflow(wf, mapping, file) {
  const problems = [];
  const names = new Set(wf.nodes.map((n) => n.name));
  for (const old of Object.keys(mapping)) if (!names.has(old)) problems.push(`ไม่พบ node "${old}" ในไฟล์`);
  for (const n of wf.nodes) if (!(n.name in mapping)) problems.push(`node "${n.name}" ไม่มีในตาราง (จะคงชื่อเดิม)`);

  const target = (old) => (old in mapping ? mapping[old] : old);
  const newNames = wf.nodes.map((n) => target(n.name));
  const dup = newNames.filter((n, i) => newNames.indexOf(n) !== i);
  if (dup.length) problems.push(`ชื่อใหม่ซ้ำกัน: ${[...new Set(dup)].join(', ')}`);
  for (const nw of newNames) {
    if (!nw.trim() || nw !== nw.trim()) problems.push(`ชื่อใหม่ว่างหรือมีช่องว่างหัว/ท้าย: "${nw}"`);
    if (/["']/.test(nw)) problems.push(`ชื่อใหม่มีเครื่องหมายคำพูด (ทำให้ expression พัง): "${nw}"`);
  }
  if (dup.length || problems.some((p) => p.startsWith('ไม่พบ') || p.startsWith('ชื่อใหม่'))) return { wf: null, problems, refCount: 0 };

  // 1) ชื่อ node
  const out = JSON.parse(JSON.stringify(wf));
  out.nodes.forEach((n) => { n.name = target(n.name); });

  // 2) connections
  const conns = {};
  for (const [src, byType] of Object.entries(out.connections || {})) {
    const nb = {};
    for (const [typ, outputs] of Object.entries(byType)) {
      nb[typ] = outputs.map((arr) => (arr || []).map((c) => ({ ...c, node: target(c.node) })));
    }
    conns[target(src)] = nb;
  }
  out.connections = conns;

  // 3) pinData
  if (out.pinData) {
    const pd = {};
    for (const [k, v] of Object.entries(out.pinData)) pd[target(k)] = v;
    out.pinData = pd;
  }

  // 4) expression references (ทำ node ที่ชื่อยาวก่อน กันชื่อซ้อนกัน)
  let refCount = 0;
  const olds = Object.keys(mapping).filter((o) => mapping[o] !== o).sort((a, b) => b.length - a.length);
  out.nodes = out.nodes.map((n) => ({
    ...n,
    parameters: walkStrings(n.parameters, (s) => {
      let t = s;
      for (const old of olds) {
        for (const [re, rep] of refPatterns(old)) {
          t = t.replace(re, () => { refCount += 1; return rep(mapping[old]); });
        }
      }
      return t;
    }),
  }));

  // 5) Code node: ชื่อ node ที่เก็บเป็นสตริงธรรมดาแล้วค่อยเรียก $(n)
  const codeNotes = [];
  out.nodes = out.nodes.map((n) => {
    if (!/\.code$/.test(n.type)) return n;
    const p = { ...n.parameters };
    for (const key of ['jsCode', 'pythonCode']) {
      if (typeof p[key] !== 'string') continue;
      for (const old of olds) {
        const re = new RegExp(`(['"])${esc(old)}\\1`, 'g');
        p[key] = p[key].replace(re, (m0, q) => { codeNotes.push(`${n.name}: ${q}${old}${q} → ${q}${mapping[old]}${q}`); return `${q}${mapping[old]}${q}`; });
      }
    }
    return { ...n, parameters: p };
  });
  for (const c of codeNotes) problems.push(`แก้สตริงใน Code node (ตรวจด้วย) — ${c}`);

  // ตรวจซ้ำ: ทุก connection และทุก expression ต้องชี้ไปที่ชื่อที่มีอยู่จริง
  const finalNames = new Set(out.nodes.map((n) => n.name));
  for (const [src, byType] of Object.entries(out.connections)) {
    if (!finalNames.has(src)) problems.push(`connection จาก "${src}" ไม่มี node นี้`);
    for (const outputs of Object.values(byType)) for (const arr of outputs) for (const c of arr || []) if (!finalNames.has(c.node)) problems.push(`connection ไป "${c.node}" ไม่มี node นี้`);
  }
  const raw = JSON.stringify(out);
  const refRe = /\$\(\s*['"]([^'"]+)['"]\s*\)|\$node\[\s*['"]([^'"]+)['"]\s*\]|\$items\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = refRe.exec(raw))) {
    const name = m[1] || m[2] || m[3];
    if (!finalNames.has(name)) problems.push(`expression ยังอ้างชื่อเก่า "${name}"`);
  }
  if (out.nodes.length !== wf.nodes.length) problems.push('จำนวน node เปลี่ยน');
  return { wf: out, problems, refCount };
}

let failed = false;
const report = [];
for (const [file, mapping] of Object.entries(MAP)) {
  if (file.startsWith('_')) continue;
  const src = path.join(ROOT, file);
  if (!fs.existsSync(src)) { console.log(`ข้าม ${file}: ไม่พบไฟล์`); continue; }
  const wf = JSON.parse(fs.readFileSync(src, 'utf8'));
  const { wf: out, problems, refCount } = renameWorkflow(wf, mapping, file);
  const changed = Object.entries(mapping).filter(([a, b]) => a !== b).length;
  const hard = problems.filter((p) => !p.includes('จะคงชื่อเดิม') && !p.startsWith('แก้สตริงใน Code node'));
  console.log(`${file}: ${wf.nodes.length} nodes, เปลี่ยนชื่อ ${changed}, แก้ expression ${refCount} จุด${hard.length ? '  ✗ ' + hard.join(' | ') : '  ✓'}`);
  for (const p of problems.filter((p) => p.includes('จะคงชื่อเดิม') || p.startsWith('แก้สตริงใน Code node'))) console.log('   หมายเหตุ: ' + p);
  if (!out || hard.length) { failed = true; continue; }
  report.push({ file, nodes: wf.nodes.length, renamed: changed, refs: refCount });
  if (!CHECK_ONLY) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, file), JSON.stringify(out, null, 2) + '\n', 'utf8');
  }
}
if (failed) { console.log('\nมีปัญหา — ไม่ได้เขียนไฟล์ที่มีปัญหา แก้ตาราง node-names.json แล้วรันใหม่'); process.exit(1); }
if (!CHECK_ONLY) console.log(`\nเขียน ${report.length} ไฟล์ลง ${path.relative(ROOT, OUT_DIR)}/ แล้ว — Import ใน n8n ทีละไฟล์ (ของเดิมไม่ถูกแตะ)`);
