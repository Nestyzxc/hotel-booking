// ตรวจไฟล์ n8n workflow (workflow-*.json) ว่า parse ได้และโครงสร้างถูกต้อง
// รันด้วย: npm run test:workflows   (ใช้ node:test ไม่ต้องติดตั้งอะไรเพิ่ม)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const files = fs.readdirSync(ROOT).filter((f) => /^workflow-.*\.json$/.test(f)).sort();

test('มีไฟล์ workflow อย่างน้อย 1 ไฟล์', () => {
  assert.ok(files.length > 0, 'ไม่พบไฟล์ workflow-*.json ที่ root ของ repo');
});

for (const file of files) {
  test(file, async (t) => {
    const raw = fs.readFileSync(path.join(ROOT, file), 'utf8');
    let wf;
    await t.test('เป็น JSON ที่ parse ได้', () => {
      wf = JSON.parse(raw);
    });
    if (!wf) return;

    const nodes = Array.isArray(wf.nodes) ? wf.nodes : [];
    const names = new Set(nodes.map((n) => n.name));

    await t.test('มี name, nodes และ connections', () => {
      assert.equal(typeof wf.name, 'string', 'ต้องมี "name" เป็นข้อความ');
      assert.ok(wf.name.trim(), '"name" ต้องไม่ว่าง');
      assert.ok(Array.isArray(wf.nodes) && wf.nodes.length > 0, 'ต้องมี "nodes" เป็น array และไม่ว่าง');
      assert.ok(wf.connections && typeof wf.connections === 'object' && !Array.isArray(wf.connections), 'ต้องมี "connections" เป็น object');
    });

    await t.test('ทุก node มีฟิลด์ที่ n8n ต้องใช้', () => {
      for (const [i, n] of nodes.entries()) {
        const where = `node #${i} (${n && n.name})`;
        assert.equal(typeof n.name, 'string', `${where}: ไม่มี name`);
        assert.ok(n.name.trim(), `${where}: name ว่าง`);
        assert.equal(typeof n.type, 'string', `${where}: ไม่มี type`);
        assert.ok(typeof n.typeVersion === 'number', `${where}: typeVersion ต้องเป็นตัวเลข`);
        assert.ok(Array.isArray(n.position) && n.position.length === 2 && n.position.every(Number.isFinite), `${where}: position ต้องเป็น [x, y]`);
        assert.ok(n.parameters && typeof n.parameters === 'object', `${where}: ไม่มี parameters`);
      }
    });

    await t.test('ชื่อ node และ id ไม่ซ้ำกัน', () => {
      const dupNames = nodes.map((n) => n.name).filter((v, i, a) => a.indexOf(v) !== i);
      assert.deepEqual(dupNames, [], `ชื่อ node ซ้ำ: ${dupNames.join(', ')}`);
      const ids = nodes.map((n) => n.id).filter(Boolean);
      const dupIds = ids.filter((v, i, a) => a.indexOf(v) !== i);
      assert.deepEqual(dupIds, [], `id ซ้ำ: ${dupIds.join(', ')}`);
    });

    await t.test('connections ชี้ไปหา node ที่มีอยู่จริง', () => {
      const broken = [];
      for (const [from, outputs] of Object.entries(wf.connections || {})) {
        if (!names.has(from)) broken.push(`ต้นทาง "${from}" ไม่มีใน nodes`);
        for (const branches of Object.values(outputs || {})) {
          for (const branch of branches || []) {
            for (const link of branch || []) {
              if (!link || !names.has(link.node)) broken.push(`"${from}" → "${link && link.node}" ไม่มีใน nodes`);
            }
          }
        }
      }
      assert.deepEqual(broken, [], broken.join('\n'));
    });

    await t.test('มี trigger node อย่างน้อย 1 ตัว', () => {
      // เดา: node ที่เป็นจุดเริ่ม workflow ของ n8n จะมีคำว่า Trigger หรือ webhook ใน type
      const triggers = nodes.filter((n) => /trigger|webhook/i.test(n.type));
      assert.ok(triggers.length > 0, 'ไม่พบ trigger node (Webhook / Schedule / Trigger)');
    });

    await t.test('ไม่มี token หรือ key ฝังอยู่ในไฟล์', () => {
      // เดา: ตรวจรูปแบบ secret ที่พบบ่อย ถ้าเจอ false positive ให้ปรับ pattern ตรงนี้
      const patterns = [
        [/ghp_[A-Za-z0-9]{30,}/, 'GitHub token'],
        [/AIza[0-9A-Za-z_-]{35}/, 'Google API key'],
        [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
        [/Bearer\s+[A-Za-z0-9+/=]{100,}/, 'LINE channel access token (Bearer ยาว)'],
      ];
      const found = patterns.filter(([re]) => re.test(raw)).map(([, label]) => label);
      assert.deepEqual(found, [], `พบข้อมูลที่ดูเหมือนค่าลับ: ${found.join(', ')}`);
    });
  });
}
