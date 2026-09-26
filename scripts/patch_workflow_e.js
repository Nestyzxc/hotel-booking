// patch_workflow_e.js — เพิ่ม "Update Customer Last Seen" หลัง Log Offer
const fs = require('fs');

const path = process.argv[2];
const json = JSON.parse(fs.readFileSync(path, 'utf8'));

const SPREADSHEET_ID = '1b3KoLtqp2wt_2rtRFNqdx0dkVoeujHMUR4QtwYwQwkA';

// Update Customers.last_seen_at หลังจากส่งดีล (log offer สำเร็จ)
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
        line_user_id: '={{ $json.line_user_id }}',
        last_seen_at: '={{ $now.setZone(\'Asia/Bangkok\').toISO() }}',
      },
    },
    matchingColumns: ['line_user_id'],
    options: {},
  },
  id: 'update-customer-lastseen',
  name: 'Update Customer Last Seen',
  type: 'n8n-nodes-base.googleSheets',
  typeVersion: 4.7,
  position: [1540, 330],
  credentials: { googleApi: { id: null, name: 'Google Sheets SA' } },
  onError: 'continueRegularOutput',
};

json.nodes.push(updateCustomerNode);

// เพิ่ม connection: Log Offer → Update Customer Last Seen
if (!json.connections['Log Offer']) {
  json.connections['Log Offer'] = { main: [[]] };
}
json.connections['Log Offer'].main[0].push({
  node: 'Update Customer Last Seen',
  type: 'main',
  index: 0,
});

fs.writeFileSync(path, JSON.stringify(json, null, 2));
console.log('Inserted Update Customer Last Seen node');
console.log('Log Offer[0] → Update Customer Last Seen');
console.log('Saved', path);
