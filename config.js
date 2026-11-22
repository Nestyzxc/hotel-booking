/* ================================================================
   Sai Lan Hotel v2 · ค่าตั้งค่าของหน้าเว็บ (ใช้ร่วมกันทั้ง index.html และ admin.html)
   แก้ไฟล์นี้ไฟล์เดียวเมื่อโดเมน ngrok หรือ LIFF เปลี่ยน ไม่ต้องแก้ไฟล์ HTML

   ทุกค่าในไฟล์นี้เป็นค่าสาธารณะ (เบราว์เซอร์ของแขกเห็นได้อยู่แล้ว)
   ห้ามใส่ Channel Access Token / Channel Secret / API key / Staff Key ในไฟล์นี้
   ค่าลับทั้งหมดอยู่ใน Credentials ของ n8n และ .env ของ docker-compose เท่านั้น
   ================================================================ */
window.SAI_LAN_CONFIG = {
  // URL สาธารณะของ n8n = https://<NGROK_DOMAIN>/webhook (ไม่ต้องมี / ปิดท้าย)
  // NGROK_DOMAIN ต้องตรงกับค่าในไฟล์ .env ที่ docker-compose ใช้
  N8N_BASE_URL: 'https://gently-condition-lumpiness.ngrok-free.dev/webhook',

  // LINE Developers > LINE Login channel > แท็บ LIFF > LIFF ID (ใช้เฉพาะ index.html)
  LIFF_ID: '2011748537-D4uPXJ9B',

  // LINE OA Manager > Basic ID เช่น @123abcde (ใช้เฉพาะ index.html)
  LINE_OA_BASIC_ID: '@416hldvs',
};
