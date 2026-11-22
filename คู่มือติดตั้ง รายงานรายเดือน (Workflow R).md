# คู่มือติดตั้ง รายงานสรุปรายเดือน PDF (Workflow R)

Nov 22, 2026 · ร่างแรก (v2.1)

Workflow R อ่านข้อมูลจาก Google Sheets ไฟล์เดิม สรุปผลประกอบการของเดือนที่แล้วเป็นไฟล์ PDF 1 หน้า A4 แล้วส่งให้เจ้าของทางอีเมล พร้อมสรุปตัวเลขสั้น ๆ ทาง LINE ทุกวันที่ 1 เวลา 08:00 พนักงานยังกดดาวน์โหลดรายงานเดือนไหนก็ได้ผ่าน API หลังบ้าน (Staff Key เดียวกับ admin.html) ทุกอย่างยังฟรี

## ภาพรวมการทำงาน

```
⏰ ทุกวันที่ 1 · 08:00          👨‍💼 GET /webhook/report?month=2026-10 (X-Staff-Key)
        │                                 │
        ▼                                 ▼
   Read Sheets                  Read Sheets · หลังบ้าน ──(error)──► Respond Error 503
        └──────────────┬──────────────────┘
                       ▼
                 Build Report        คำนวณตัวเลข + สร้างหน้า HTML
                       ▼
                  Render PDF         Gotenberg (docker) แปลง HTML → PDF ──(error)──► 502 / Stop
                       ▼
           ┌───── จากหลังบ้าน? ─────┐
           ▼ ใช่                     ▼ ไม่ใช่ (ตั้งเวลา)
     Respond · PDF            ส่งอีเมล? → Send Email · เจ้าของ (แนบ PDF)
                              แจ้ง LINE? → Push LINE · เจ้าของ (สรุปสั้น)
                 + Log Activity (ทุกครั้ง)
```

ทำไมใช้ Gotenberg: n8n ไม่มี node สร้าง PDF ในตัว บริการ PDF ออนไลน์ส่วนใหญ่มีโควตาฟรีน้อยหรือต้องใช้บัตร Gotenberg เป็น docker โอเพนซอร์สที่ใช้ Chromium แปลง HTML เป็น PDF รันคู่กับ n8n ในเครื่องเดียวกัน ไม่มีค่าใช้จ่าย และมีฟอนต์ไทย (Noto Sans Thai) มาในตัว

## ขั้นที่ 1 · เพิ่ม Gotenberg ใน docker

docker-compose.yml ใน repo เพิ่ม service `gotenberg` ไว้แล้ว ดึงไฟล์ล่าสุดแล้วรัน

```bash
docker compose pull gotenberg
docker compose up -d
docker compose ps          # ต้องเห็น gotenberg สถานะ running
```

ไม่ต้องเปิด port ใหม่ n8n เรียกผ่าน `http://gotenberg:3000` ในเครือข่ายภายในของ docker ถ้ารัน Gotenberg ที่อื่น ให้ใส่ URL ใน Config → `gotenberg_url`

## ขั้นที่ 2 · Config ใหม่ในชีต Config

เพิ่มแถวเหล่านี้ (คอลัมน์ key / value) ทุกแถวไม่บังคับ ถ้าเว้นว่าง ส่วนนั้นจะถูกข้ามไป

| key | ตัวอย่าง | ใช้ทำอะไร |
| --- | --- | --- |
| report_email | owner@example.com | อีเมลผู้รับ PDF (หลายคนคั่นด้วยจุลภาค) · ว่าง = ไม่ส่งอีเมล |
| report_email_from | sailanhotel@gmail.com | อีเมลผู้ส่ง ต้องตรงกับบัญชี SMTP · ว่าง = ใช้ report_email |
| report_line_to | Uxxxxxxxx… หรือ Cxxxxxxxx… | LINE userId ของเจ้าของ หรือ groupId ของกลุ่มผู้บริหาร · ว่าง = ไม่ส่ง LINE |
| report_enabled | TRUE | ใส่ FALSE เพื่อปิดการส่งอัตโนมัติ (ยังดาวน์โหลดจากหลังบ้านได้) |
| gotenberg_url | http://gotenberg:3000 | เปลี่ยนเฉพาะเมื่อ Gotenberg ไม่ได้อยู่ใน docker-compose เดียวกัน |

**อย่าใส่ housekeeping_group_id ใน report_line_to** เพราะรายงานมีตัวเลขรายได้ ควรส่งเฉพาะเจ้าของหรือผู้จัดการ

หา userId ของเจ้าของ: ให้เจ้าของทักแชท LINE OA แล้วดูคอลัมน์ line_user_id ในชีต Messages

## ขั้นที่ 3 · Credential ใน n8n

| ชื่อ Credential (ต้องตรงทุกตัวอักษร) | ชนิด | สิ่งที่ต้องทำ |
| --- | --- | --- |
| Google Sheets SA | Google Service Account API | ใช้ของเดิม |
| LINE Channel Token | Header Auth | ใช้ของเดิม |
| Staff Key | Header Auth | ใช้ของเดิม (X-Staff-Key) |
| SMTP Report | SMTP (ใหม่) | Gmail: Host smtp.gmail.com · Port 465 · SSL/TLS เปิด · User = อีเมล Gmail · Password = App Password 16 ตัว (Google Account → Security → 2-Step Verification → App passwords) |

Gmail ส่งฟรีได้ประมาณ 500 ฉบับ/วัน รายงานเดือนละ 1 ฉบับจึงเหลือเฟือ ถ้ายังไม่อยากส่งอีเมล ให้เว้น report_email ว่างไว้ แล้วกด Deactivate ที่ node Send Email ได้

## ขั้นที่ 4 · Import และทดสอบ

1. n8n → Workflow menu → Import from File → `workflow-r-monthly-report.json`
2. ตรวจว่าทุก node ผูก credential ครบ (ไม่มีไอคอนเตือนสีแดง)
3. Save → Activate
4. ทดสอบดาวน์โหลด PDF ของเดือนที่แล้ว

```bash
curl -H "X-Staff-Key: <รหัสพนักงาน>" \
  "https://<ngrok-domain>/webhook/report?month=2026-10" -o report.pdf
```

5. ทดสอบส่งอีเมล/LINE: เปิด workflow → คลิก node `ทุกวันที่ 1 · 08:00` → Execute step (จะสรุปเดือนที่แล้วและส่งจริง)

พารามิเตอร์ `month` รับรูปแบบ `yyyy-MM` ถ้าไม่ใส่หรือผิดรูปแบบ จะได้เดือนที่แล้ว

## ตัวเลขในรายงาน

| ส่วน | ตัวเลข | นับอย่างไร |
| --- | --- | --- |
| การ์ดสรุป | รายได้ค่าห้องพัก | ผลรวม price_total (หลังหักส่วนลด) แบ่งตามคืนที่พักจริงในเดือน ไม่นับ Cancelled / No-show |
| | อัตราการเข้าพัก | ห้อง-คืนที่ขาย ÷ (จำนวนห้องในชีต Rooms × จำนวนวันในเดือน) |
| | ADR | รายได้ ÷ ห้อง-คืนที่ขาย |
| | RevPAR | รายได้ ÷ ห้อง-คืนทั้งหมดที่มี |
| | แขกเข้าพัก | การจองที่ check_in อยู่ในเดือน + จำนวนผู้ใหญ่/เด็ก |
| | คะแนนเฉลี่ย | rating 1–5 ของการจองที่เช็กอินในเดือน |
| | ลูกศร ▲▼ | เทียบกับเดือนก่อนหน้า (อัตราเข้าพักเทียบเป็นจุด %) |
| กราฟ | อัตราการเข้าพักรายวัน | แท่งสีเข้ม = เสาร์–อาทิตย์ |
| ตาราง | แยกตามประเภทห้อง | จำนวนห้อง คืนที่ขาย % เข้าพัก รายได้ ADR |
| | ช่องทางการจอง | ตามคอลัมน์ source (LINE เว็บไซต์ Walk-in โทรศัพท์ OTA) |
| การจอง | ใหม่ / ยกเลิก / No-show | ใหม่ = created_at ในเดือน · ยกเลิก = cancelled_at ในเดือน · No-show = check_in ในเดือน |
| | ส่วนลดที่ให้ไป | ผลรวม discount ของการจองใหม่ที่ไม่ถูกยกเลิก |
| | ค้างชำระ | เช็กเอาต์ในเดือนแล้วแต่ payment_status ไม่ใช่ Paid (สีแดงถ้ามี) |
| ความพึงพอใจ | การกระจายดาว + ปัญหาที่แจ้ง | rating และ issue_category |
| ลูกค้า | ลูกค้าใหม่ / กลับมาพัก | ระบุตัวด้วย line_user_id → เบอร์โทร → อีเมล · "กลับมา" = เคยเข้าพักก่อนเดือนนี้ |
| | ดีลส่วนตัว (Workflow E) | ส่งในเดือน (Offers.sent_at) และกลับมาจองในเดือน (converted_at) |
| | สิ่งที่แขกชอบ | preference_tags ที่ Gemini สรุป (Workflow D) ของแขกที่เช็กเอาต์ในเดือน |

## แก้ไขปัญหา

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| หลังบ้านได้ 502 "สร้างไฟล์ PDF ไม่สำเร็จ" | Gotenberg ไม่ทำงาน → `docker compose ps` / `docker compose logs gotenberg` |
| ตั้งเวลาแล้ว execution ขึ้น error "สร้าง PDF ไม่สำเร็จ" | เหมือนข้างบน หรือ gotenberg_url ผิด |
| Send Email error "Invalid login" | ใช้รหัส Gmail ปกติ ต้องใช้ App Password และเปิด 2-Step Verification |
| PDF เป็นสี่เหลี่ยมแทนตัวอักษรไทย | ใช้ image Gotenberg ที่ไม่ใช่ตัวเต็ม (เช่น -chromium slim) ให้ใช้ `gotenberg/gotenberg:8.40.0` ตาม docker-compose |
| อัตราการเข้าพักสูง/ต่ำผิดปกติ | ตรวจชีต Rooms ว่ามีครบทุกห้องจริง และ check_in / check_out เป็นวันที่ถูกต้อง |
