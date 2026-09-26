// patch_workflow_d.js — เพิ่ม node "Update Customer Tags" หลัง Save Tags + เพิ่ม line_user_id ใน Parse Tags output
const fs = require('fs');

const path = process.argv[2];
const json = JSON.parse(fs.readFileSync(path, 'utf8'));

const SPREADSHEET_ID = '1b3KoLtqp2wt_2rtRFNqdx0dkVoeujHMUR4QtwYwQwkA';

// =========================================================
// 1) แก้ Parse Tags: เพิ่ม line_user_id ใน output
// =========================================================
let parsePatched = false;
for (const node of json.nodes) {
  if (node.id === 'dc38ca45-9a94-5a6c-ab40-afa0eae8d5fd' && node.parameters && node.parameters.jsCode) {
    const code = node.parameters.jsCode;
    // เปลี่ยน build Prompt line จาก src.booking_id → src.booking_id + src.line_user_id
    const oldLine = `out.push({ json: { booking_id: src.booking_id, preference_tags: clean.join(',') || '-', raw }, pairedItem: { item: i } });`;
    const newLine = `out.push({ json: { booking_id: src.booking_id, line_user_id: src.line_user_id || '', preference_tags: clean.join(',') || '-', raw }, pairedItem: { item: i } });`;

    if (code.includes(oldLine)) {
      node.parameters.jsCode = code.replace(oldLine, newLine);
      parsePatched = true;
      console.log('Patched Parse Tags: added line_user_id');
    } else {
      console.log('ERROR: Parse Tags output line not found');
    }
  }
}
if (!parsePatched) {
  console.log('Parse Tags node not found - skipping');
}

// =========================================================
// 2) เพิ่ม node "Update Customer Tags"
// =========================================================
const updateCustomerTagsNode = {
  parameters: {
    authentication: 'serviceAccount',
    resource: 'sheet',
    operation: 'update',
    documentId: { __rl: true, value: SPREADSHEET_ID, mode: 'id' },
    sheetName: { __rl: true, value: 'Customers', mode: 'name' },
    columns: {
      mappingMode: 'defineBelow',
      value: {
        line_user_id: '={{ $json.line_user_id }}',
        last_preference_tags: '={{ $json.preference_tags }}',
      },
    },
    matchingColumns: ['line_user_id'],
    options: {},
  },
  id: 'update-customer-tags',
  name: 'Update Customer Tags',
  type: 'n8n-nodes-base.googleSheets',
  typeVersion: 4.7,
  position: [1980, 300],
  credentials: { googleApi: { id: null, name: 'Google Sheets SA' } },
  onError: 'continueRegularOutput',
};

json.nodes.push(updateCustomerTagsNode);

// =========================================================
// 3) เพิ่ม connection: Parse Tags → Update Customer Tags (ขนานกับ Save Tags)
// =========================================================
if (!json.connections['Parse Tags']) {
  console.log('ERROR: Parse Tags not found');
  process.exit(1);
}
json.connections['Parse Tags'].main[0].push({
  node: 'Update Customer Tags',
  type: 'main',
  index: 0,
});

fs.writeFileSync(path, JSON.stringify(json, null, 2));
console.log('Inserted Update Customer Tags node');
console.log('Save Tags[0] → Update Customer Tags');
console.log('Saved', path);
