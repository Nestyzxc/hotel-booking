// patch_workflow_a.js — เพิ่ม "Upsert Customer" node หลัง Save Booking ใน workflow A
const fs = require('fs');

const path = process.argv[2];
const json = JSON.parse(fs.readFileSync(path, 'utf8'));

const SPREADSHEET_ID = '1b3KoLtqp2wt_2rtRFNqdx0dkVoeujHMUR4QtwYwQwkA';

// =========================================================
// 1) สร้าง node "Lookup Customer" (Google Sheets - read rows by filter)
// =========================================================
const lookupCustomerNode = {
  parameters: {
    authentication: 'serviceAccount',
    resource: 'sheet',
    operation: 'read',
    documentId: { __rl: true, value: SPREADSHEET_ID, mode: 'id' },
    sheetName: { __rl: true, value: 'Customers', mode: 'name' },
    filtersUI: {
      values: [
        {
          lookupColumn: 'line_user_id',
          lookupValue: '={{ $json.booking.line_user_id }}',
        },
      ],
    },
    returnAllMatches: false,
    options: {},
  },
  id: 'lookup-customer-001',
  name: 'Lookup Customer',
  type: 'n8n-nodes-base.googleSheets',
  typeVersion: 4.7,
  position: [1540, 380],
  credentials: { googleApi: { id: null, name: 'Google Sheets SA' } },
  retryOnFail: true,
  maxTries: 2,
  waitBetweenTries: 800,
  alwaysOutputData: true,
};

// =========================================================
// 2) สร้าง node "Upsert Customer" (Code node: ตัดสิน append vs update)
// =========================================================
const upsertCode = `// ===== Upsert Customer =====
// รับ booking object → ถ้า line_user_id มีอยู่แล้ว → update (last_seen_at + name/phone/email)
// ถ้าไม่มี → append ใหม่ (first_seen_at = last_seen_at = now)
const ZONE = 'Asia/Bangkok';
const $now = DateTime.now().setZone(ZONE);
const TS = $now.toISO();

const b = $('Save Booking').first().json.booking || {};
const uid = String(b.line_user_id || '').trim();
const name = String(b.full_name || '').trim();
const phone = String(b.phone || '').trim();
const email = String(b.email || '').trim();

if (!uid) {
  // ไม่มี line_user_id (Walk-in) → ไม่สร้าง Customer
  return [{ json: { skipped: true, reason: 'no_line_user_id' }, pairedItem: { item: 0 } }];
}

// ดูว่ามี customer row อยู่ไหม (จาก Lookup Customer)
const existing = $('Lookup Customer').all().map((i) => i.json).filter((c) => c && c.line_user_id === uid);

if (existing.length > 0) {
  const c = existing[0];
  // Update: เพิ่ม last_seen_at + เขียนทับ name/phone/email ด้วยค่าล่าสุด
  const updates = {
    line_user_id: uid,
    last_seen_at: TS,
    full_name: name || c.full_name || '',
    phone: phone || c.phone || '',
    email: email || c.email || '',
  };
  return [{
    json: {
      action: 'update',
      row_number: c.__rowNumber || c.row_number || '',
      updates,
    },
    pairedItem: { item: 0 },
  }];
} else {
  // Append: สร้าง row ใหม่
  return [{
    json: {
      action: 'append',
      new_row: {
        line_user_id: uid,
        first_seen_at: TS,
        last_seen_at: TS,
        full_name: name,
        phone: phone,
        email: email,
        total_stays: 0,
        total_nights: 0,
        lifetime_value: 0,
        last_preference_tags: '',
        marketing_opt_out: 'FALSE',
        notes: '',
      },
    },
    pairedItem: { item: 0 },
  }];
}
`;

const upsertCodeNode = {
  parameters: {
    mode: 'runOnceForAllItems',
    language: 'javaScript',
    jsCode: upsertCode,
  },
  id: 'upsert-customer-code',
  name: 'Decide Upsert',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [1740, 380],
};

// =========================================================
// 3) Switch: route append vs update
// =========================================================
const switchNode = {
  parameters: {
    rules: {
      values: [
        {
          conditions: {
            options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
            conditions: [
              {
                leftValue: '={{ $json.action }}',
                rightValue: 'append',
                operator: { type: 'string', operation: 'equals' },
              },
            ],
            combinator: 'and',
          },
          renameOutput: true,
          outputKey: 'append',
        },
        {
          conditions: {
            options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
            conditions: [
              {
                leftValue: '={{ $json.action }}',
                rightValue: 'update',
                operator: { type: 'string', operation: 'equals' },
              },
            ],
            combinator: 'and',
          },
          renameOutput: true,
          outputKey: 'update',
        },
      ],
    },
    options: {},
  },
  id: 'switch-upsert',
  name: 'Append or Update?',
  type: 'n8n-nodes-base.switch',
  typeVersion: 3.2,
  position: [1940, 380],
};

// =========================================================
// 4) Append Customer node
// =========================================================
const appendCustomerNode = {
  parameters: {
    authentication: 'serviceAccount',
    resource: 'sheet',
    operation: 'append',
    documentId: { __rl: true, value: SPREADSHEET_ID, mode: 'id' },
    sheetName: { __rl: true, value: 'Customers', mode: 'name' },
    columns: {
      mappingMode: 'defineBelow',
      value: {
        line_user_id: '={{ $json.new_row.line_user_id }}',
        first_seen_at: '={{ $json.new_row.first_seen_at }}',
        last_seen_at: '={{ $json.new_row.last_seen_at }}',
        full_name: '={{ $json.new_row.full_name }}',
        phone: '={{ $json.new_row.phone }}',
        email: '={{ $json.new_row.email }}',
        total_stays: '={{ $json.new_row.total_stays }}',
        total_nights: '={{ $json.new_row.total_nights }}',
        lifetime_value: '={{ $json.new_row.lifetime_value }}',
        last_preference_tags: '={{ $json.new_row.last_preference_tags }}',
        marketing_opt_out: '={{ $json.new_row.marketing_opt_out }}',
        notes: '={{ $json.new_row.notes }}',
      },
    },
    options: {},
  },
  id: 'append-customer',
  name: 'Append Customer',
  type: 'n8n-nodes-base.googleSheets',
  typeVersion: 4.7,
  position: [2140, 320],
  credentials: { googleApi: { id: null, name: 'Google Sheets SA' } },
  onError: 'continueRegularOutput',
};

// =========================================================
// 5) Update Customer node
// =========================================================
const updateCustomerNode = {
  parameters: {
    authentication: 'serviceAccount',
    resource: 'sheet',
    operation: 'update',
    documentId: { __rl: true, value: SPREADSHEET_ID, mode: 'id' },
    sheetName: { __rl: true, value: 'Customers', mode: 'name' },
    columns: {
      mappingMode: 'defineBelow',
      value: {
        line_user_id: '={{ $json.updates.line_user_id }}',
        last_seen_at: '={{ $json.updates.last_seen_at }}',
        full_name: '={{ $json.updates.full_name }}',
        phone: '={{ $json.updates.phone }}',
        email: '={{ $json.updates.email }}',
      },
    },
    matchingColumns: ['line_user_id'],
    options: {},
  },
  id: 'update-customer',
  name: 'Update Customer',
  type: 'n8n-nodes-base.googleSheets',
  typeVersion: 4.7,
  position: [2140, 460],
  credentials: { googleApi: { id: null, name: 'Google Sheets SA' } },
  onError: 'continueRegularOutput',
};

// =========================================================
// Insert nodes
// =========================================================
const idsToInsert = [lookupCustomerNode, upsertCodeNode, switchNode, appendCustomerNode, updateCustomerNode].map((n) => n.id);

json.nodes.push(lookupCustomerNode, upsertCodeNode, switchNode, appendCustomerNode, updateCustomerNode);

// =========================================================
// Update connections:
//   Save Booking → [Personal Deal Used? (เดิม), Lookup Customer (ใหม่)]
//   Lookup Customer → Decide Upsert
//   Decide Upsert → Switch
//   Switch [append] → Append Customer
//   Switch [update] → Update Customer
// =========================================================

// แก้ Save Booking connections: เพิ่ม index 1 (ทางใหม่)
const saveBookingConns = json.connections['Save Booking'];
// เพิ่มไปที่ Lookup Customer ที่ output index 0 (success path)
saveBookingConns.main[0].push({
  node: 'Lookup Customer',
  type: 'main',
  index: 0,
});

// เพิ่ม connections ใหม่
json.connections['Lookup Customer'] = {
  main: [[{ node: 'Decide Upsert', type: 'main', index: 0 }]],
};

json.connections['Decide Upsert'] = {
  main: [[{ node: 'Append or Update?', type: 'main', index: 0 }]],
};

json.connections['Append or Update?'] = {
  main: [
    [{ node: 'Append Customer', type: 'main', index: 0 }],  // append path
    [{ node: 'Update Customer', type: 'main', index: 0 }],  // update path
  ],
};

// Append/Update ไม่ต้องต่อไปไหน (จบ)

fs.writeFileSync(path, JSON.stringify(json, null, 2));
console.log('Inserted', idsToInsert.length, 'nodes');
console.log('Connections updated:');
console.log('  Save Booking[0] → Lookup Customer');
console.log('  Lookup Customer → Decide Upsert');
console.log('  Decide Upsert → Append or Update?');
console.log('  Append or Update? [append] → Append Customer');
console.log('  Append or Update? [update] → Update Customer');
console.log('Saved', path);
