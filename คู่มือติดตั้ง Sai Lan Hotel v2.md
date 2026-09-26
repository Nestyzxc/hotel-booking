# คู่มือติดตั้ง Sai Lan Hotel v2

Sep 26, 2026 · @NextplayStudio

v2 เพิ่มหน้าจองแบบเว็บ OTA ที่หักส่วนลดบนหน้าเว็บ ระบบหลังบ้านพนักงาน และการแจ้งกลุ่มแม่บ้านทาง LINE ติดตั้งทับระบบเดิมได้ใน 6 ขั้นตอน โดยใช้ Google Sheets ไฟล์เดิม ทุกอย่างยังฟรีและทดสอบกับ n8n 2.32.6 แล้ว (API 147 รายการ, หน้าเว็บ 77 รายการ ผ่านทั้งหมด)

## ภาพรวมการทำงาน

&#91;embedded content: สถาปัตยกรรม v2 · หน้าเว็บ/LINE → n8n → Sheets/LINE\]

หน้าเว็บและ LINE ไม่คุยกับ Google Sheets โดยตรง n8n เป็นตัวกลางเดียวที่ถือ Token และรหัสทั้งหมด หน้าเว็บจึงไม่มีค่าลับใด ๆ

## ไฟล์ใน v2

v2 มี workflow ใหม่ 3 ตัว (Q, S, F) และแทนของเดิม 3 ตัว (A, B, E) ส่วน C, D, docker-compose.yml และรูป Rich Menu ใช้ของเดิมได้เลย

| ไฟล์ | ใช้ทำอะไร | สถานะ |
| --- | --- | --- |
| workflow-q-hotel-api.json | Q: ส่งข้อมูลโรงแรม ห้องว่าง ราคา และตรวจโค้ดส่วนลดให้หน้าจอง (GET /webhook/hotel) | ใหม่ |
| workflow-a-booking-v2.json | A v2: รับจอง คิดราคาและส่วนลดฝั่ง n8n จัดห้องอัตโนมัติ แจ้งกลุ่มแม่บ้าน ส่งใบยืนยัน | แทน A เดิม |
| workflow-b-line-router-v2.json | B v2: เมนู LINE คะแนน แจ้งปัญหา แขกยกเลิกเอง ตั้งกลุ่ม ปุ่มสถานะห้องของแม่บ้าน | แทน B เดิม |
| workflow-s-staff-api.json | S: API ของหน้าหลังบ้าน (GET = ดึงข้อมูล, POST = เช็กอิน/เช็กเอาต์/ยกเลิก ฯลฯ) | ใหม่ |
| workflow-f-daily-operations.json | F: ทุกวัน 09:00 ส่งข้อความก่อนเข้าพัก และสรุปงานให้กลุ่มแม่บ้าน | ใหม่ |
| workflow-e-rebooking-offer-v2.json | E v2: ดีลจองตรง ปุ่มเปิดหน้าจองพร้อมใส่โค้ดให้อัตโนมัติ | แทน E เดิม |
| workflow-c-first-night-rating.json, workflow-d-preference-summary.json | คะแนนคืนแรก 20:00 และสรุปความชอบด้วย Gemini | ใช้ต่อ ไม่ต้องแก้ |
| index.html | หน้าจองแบบ Agoda/Booking: รูป ห้องว่าง ราคา โค้ดส่วนลด ขั้นตอนยืนยัน | แทนของเดิม |
| admin.html | ระบบหลังบ้านพนักงาน: ภาพรวมวันนี้ การจอง ห้องพัก/แม่บ้าน บันทึกการจอง ตั้งค่า | ใหม่ |
| sai-lan-sheets-v2.xlsx | ชีตใหม่ 4 ชีต + หัวคอลัมน์ Bookings ใหม่ + แถว Config ใหม่ | ใหม่ |
| flex-samples-v2.json | ข้อความ Flex จริงจากระบบ 8 แบบ สำหรับ LINE Flex Message Simulator หรือทำสไลด์ | แทน flex-\*.json เดิม |

## ขั้นที่ 1 · ปรับ Google Sheets

ใช้ไฟล์เดิมที่ n8n อ่านอยู่ ไม่ต้องแชร์ Service Account ใหม่ ทำ 5 ข้อนี้ให้ครบก่อน import workflow

1. เปิดไฟล์ → ไฟล์ → นำเข้า → อัปโหลด sai-lan-sheets-v2.xlsx → ตำแหน่งนำเข้า **แทรกชีตใหม่** → ได้ชีต RoomTypes, Rooms, Promos, ActivityLog และแท็บช่วย 3 แท็บ
2. ชีต Bookings: คัดลอก Q1:AD1 จากแท็บ Bookings\_คอลัมน์ใหม่ ไปวางที่ Bookings!Q1 ต้องมีครบ 14 คอลัมน์ (adults ถึง staff\_note) ไม่อย่างนั้น Save Booking จะ error ว่า Column names were updated after the node's setup
3. ชีต Config: คัดลอกแถวจากแท็บ Config\_แถวใหม่ (เฉพาะคอลัมน์ A:B) ไปต่อท้าย คีย์ที่มีอยู่แล้วให้แก้ค่าแทน เช่น hotel\_name = Sai Lan Hotel, wifi\_name = SaiLan\_Guest · housekeeping\_group\_id เว้นว่างไว้
4. แก้ RoomTypes และ Rooms ให้ตรงกับโรงแรม (ตารางด้านล่าง) และใส่โค้ดทั่วไปใน Promos วันที่พิมพ์แบบ 2026-12-31
5. ชีต Bookings คอลัมน์ G:H ตั้งเป็น รูปแบบ → ตัวเลข → ข้อความธรรมดา ถ้ามี dropdown สถานะให้เพิ่ม Cancelled และ No-show แล้วลบแท็บช่วย 3 แท็บทิ้งได้

| ชีตใหม่ | 1 แถว = | n8n ใช้ทำอะไร |
| --- | --- | --- |
| RoomTypes | ประเภทห้อง 1 แบบ | ราคาวันธรรมดา (price) และศุกร์–เสาร์ (weekend\_price) คนสูงสุด รูป และรายละเอียดบนหน้าเว็บ |
| Rooms | ห้องจริง 1 ห้อง | นับห้องว่าง จัดห้องให้แขก และเก็บสถานะแม่บ้าน (Clean / Dirty / Cleaning / Out of Order) |
| Promos | โค้ดทั่วไป 1 โค้ด | ตรวจโค้ดบนหน้าจอง (โค้ดส่วนตัว BACK-XXXX อยู่ใน Offers เหมือนเดิม) |
| ActivityLog | 1 เหตุการณ์ | บันทึกว่าใครทำอะไร เมื่อไร n8n เขียนเอง |

รูปภาพใส่ทีหลังได้: รูปโรงแรมที่ Config → hotel\_gallery\_urls และรูปห้องที่ RoomTypes → image\_urls (หลายรูปคั่นด้วยขึ้นบรรทัดใหม่หรือจุลภาค) ใช้ลิงก์ https:// หรือไฟล์ใน repo เดียวกับหน้าเว็บ เช่น images/lobby.jpg ระหว่างนี้หน้าเว็บแสดงกรอบ preview พร้อมชื่อห้องแทน

## ขั้นที่ 2 · Credential ใน n8n

Workflow v2 อ้าง credential ด้วยชื่อ ถ้าชื่อตรงตามตาราง n8n จะผูกให้เองตอน import ไม่ต้องเลือกทีละ node

| ชื่อ Credential (ต้องตรงทุกตัวอักษร) | ชนิด | สิ่งที่ต้องทำ |
| --- | --- | --- |
| Google Sheets SA | Google Service Account API | เปิด Set up for use in HTTP Request node แล้วใส่ Scope(s) = https://www.googleapis.com/auth/spreadsheets |
| LINE Channel Token | Header Auth | ใช้ของเดิม (Name Authorization, Value Bearer + Channel access token) |
| Staff Key | Header Auth (ใหม่) | Name = X-Staff-Key, Value = รหัสพนักงานที่ตั้งเอง ยาว 16 ตัวขึ้นไป |

ทำไมต้องเปิด HTTP Request: v2 อ่านทุกชีตในคำขอเดียว (Sheets API values:batchGet) ใช้ 1 read ต่อรอบแทน 4–6 จึงไม่ชนโควตาฟรี 60 reads/นาที ถ้าไม่เปิด node Read Sheets จะได้ 403 หรือ 401

สร้าง Staff Key: Credentials → Add credential → ค้น Header Auth → ใส่ Name และ Value → แก้ชื่อ credential ด้านบนเป็น Staff Key → Save รหัสนี้คือสิ่งที่พนักงานพิมพ์ตอนเข้า admin.html ห้ามใส่ไว้ในไฟล์ HTML ถ้ารหัสหลุดให้แก้ Value แล้วพนักงานทุกคนจะต้องเข้าสู่ระบบใหม่

## ขั้นที่ 3 · สลับ workflow เป็น v2

ปิดของเดิมก่อน เพราะ A v2 และ B v2 ใช้ path booking และ line เดิม ถ้าเปิดซ้อนกัน Publish จะ error ว่า webhook ชนกัน และ E สองตัวจะส่งดีลซ้ำ

1. เปิด 6 ไฟล์ใน Notepad → Ctrl+H → Replace All: YOUR\_SPREADSHEET\_ID → ID ของชีต (ส่วนระหว่าง /d/ กับ /edit ใน URL) และ YOUR\_GITHUB\_USERNAME → ชื่อผู้ใช้ GitHub (มีใน Q, A v2, S เป็น Allowed Origins)
2. ใน n8n เปิด workflow เดิม A, B, E → Unpublish (หรือลบ) · C และ D เปิดใช้ต่อได้เลย
3. Import ทีละไฟล์ (ลากไฟล์วางบน canvas หรือ … → Import from File) เรียง Q → A v2 → B v2 → S → F → E v2
4. ในแต่ละ workflow ตรวจว่าไม่มี node ที่ขึ้นเตือนสีแดงเรื่อง credential แล้วกด Publish ถ้ามีเตือน แปลว่าชื่อ credential ไม่ตรงตามขั้นที่ 2 เลือกให้เองใน node นั้นได้

| Workflow | เริ่มทำงานเมื่อ | URL หรือเวลา |
| --- | --- | --- |
| Q - Hotel API | หน้าจองเปิดหรือค้นหา | GET https://โดเมน-ngrok/webhook/hotel |
| A - Booking Confirmation v2 | แขกกดยืนยันการจอง | POST …/webhook/booking |
| B - LINE Router v2 | มีข้อความหรือปุ่มจาก LINE | POST …/webhook/line (URL เดิมใน LINE Developers) |
| S - Staff API | พนักงานใช้หน้าหลังบ้าน | GET และ POST …/webhook/admin |
| F - Daily Pre-arrival & Housekeeping | ตั้งเวลา | ทุกวัน 09:00 |
| E - Direct Re-booking Offer v2 | ตั้งเวลา | ทุกวัน 10:00 |
| C, D (เดิม) | ตั้งเวลา | 20:00 และทุกชั่วโมง |

ทุกไฟล์ตั้ง timezone Asia/Bangkok ไว้แล้ว และทดสอบ import กับ n8n 2.32.6 แล้วได้ค่าเดิมทุก node

## ขั้นที่ 4 · ตั้งกลุ่ม LINE แม่บ้านและพนักงาน

ไม่ต้องหา Group ID เอง บอทถามหน้าที่ของกลุ่มแล้วบันทึกลงชีต Config ให้เอง

1. LINE Official Account Manager → ตั้งค่า → ตั้งค่าบัญชี → เปิด "อนุญาตให้บัญชีเข้าร่วมกลุ่มแชท" (Allow account to join groups and multi-person chats)
2. สร้างกลุ่ม LINE ของแม่บ้าน แล้วเชิญบัญชีโรงแรมเข้ากลุ่ม
3. บอทส่งการ์ด "กลุ่มนี้ใช้ทำอะไรคะ?" → กด **🧹 กลุ่มแม่บ้าน** → ระบบเติม housekeeping\_group\_id ให้เอง
4. กลุ่มพนักงานต้อนรับ: ถ้ามี staff\_group\_id จาก v1 แล้วไม่ต้องทำอะไร ถ้ายังไม่มี ทำแบบเดียวกันแล้วกด **🛎️ กลุ่มพนักงาน**
5. ในข้อความแจ้งเช็กเอาต์ แม่บ้านกด "เริ่มทำความสะอาด" (ห้องเป็น Cleaning) และ "ห้องพร้อมแล้ว ✅" (ห้องเป็น Clean) สถานะขึ้นในหน้าหลังบ้านทันที

ต้องการเปลี่ยนกลุ่ม: ลบค่า housekeeping\_group\_id (หรือ staff\_group\_id) ในชีต Config แล้วเชิญบอทเข้ากลุ่มใหม่

โควตาฟรี 300 ข้อความ/เดือน นับเฉพาะ push และ push เข้ากลุ่มนับตามจำนวนสมาชิก:

| เหตุการณ์ | ส่งถึง | นับโควตา |
| --- | --- | --- |
| จองสำเร็จ | แขก + กลุ่มแม่บ้าน | 1 + จำนวนสมาชิกกลุ่ม |
| เช็กเอาต์ หรือย้ายห้อง | กลุ่มแม่บ้าน | จำนวนสมาชิกกลุ่ม |
| สรุปงานเช้า 09:00 | กลุ่มแม่บ้าน | จำนวนสมาชิกกลุ่ม ต่อวัน |
| ข้อความก่อนเข้าพัก และขอคะแนนคืนแรก | แขก | 1 ต่อครั้ง |
| แขกแจ้งปัญหา | กลุ่มพนักงาน | จำนวนสมาชิกกลุ่ม |
| ตอบเมนู ปุ่ม และการยกเลิก (reply) | แขกหรือกลุ่ม | ฟรี |

กลุ่มแม่บ้าน 3 คน ใช้ประมาณ 9 ข้อความต่อการเข้าพัก 1 ครั้ง และสรุปเช้าอีก 90 ข้อความ/เดือน ปิดรายการที่ไม่จำเป็นได้ที่หน้าหลังบ้าน → ตั้งค่าการแจ้งเตือน ถ้าโควตาหมด การจองยังบันทึกได้ปกติ แต่ข้อความ push จะไม่ถูกส่ง

## ขั้นที่ 5 · อัปโหลดหน้าเว็บ

ทั้งสองไฟล์ไม่มีค่าลับ แก้ค่าบนสุดของไฟล์แล้วอัปโหลดทับของเดิมใน repo GitHub Pages

1. index.html: N8N\_BASE\_URL = https://โดเมน-ngrok/webhook (ไม่มี / ปิดท้าย) แทน N8N\_WEBHOOK\_URL เดิมที่ลงท้าย /booking แล้วใส่ LIFF\_ID กับ LINE\_OA\_BASIC\_ID ค่าเดิม
2. admin.html: แก้ N8N\_BASE\_URL ค่าเดียว
3. อัปโหลดทั้งสองไฟล์ไป repo เดิม → Commit → รอ 1–2 นาที LIFF Endpoint URL ใช้ค่าเดิม
4. หน้าหลังบ้านเปิดที่ https://ชื่อผู้ใช้.github.io/ชื่อ-repo/admin.html เข้าด้วยชื่อพนักงาน + รหัส Staff Key (ระบบลืมรหัสเมื่อปิดแท็บ)
5. ดูหน้าตาหน้าจองโดยไม่ต้องเปิด n8n: เปิด index.html?preview=1 (ข้อมูลตัวอย่าง ไม่บันทึกจริง)

หน้าจองมี: แกลเลอรี่ 5 รูปพร้อมดูเต็มจอ ค้นหาตามวันและจำนวนผู้ใหญ่/เด็ก ห้องว่างและราคาต่อคืน (ศุกร์–เสาร์คิดราคา weekend) โค้ดส่วนลดแสดงราคาหลังหัก ขั้นตอนยืนยันพร้อมเวลาเดินทางถึงและคำขอพิเศษ นโยบาย แผนที่ และคะแนนจากผู้เข้าพักจริง เปิดบนเว็บดูห้องได้เลย ล็อกอิน LINE เฉพาะตอนจอง และข้อมูลที่เลือกไว้ไม่หายหลังล็อกอิน

หน้าหลังบ้านมี: ภาพรวมวันนี้ (เข้า/ออก/เรื่องค้าง พร้อมปุ่มทำงานทันที) รายการจองค้นหาได้ แก้ไข/ย้ายห้อง/ยกเลิก ผังห้องแยกชั้นและผัง 14 วัน บันทึกการจอง Walk-in/โทร/OTA และสวิตช์เปิดปิดการแจ้งเตือน รีเฟรชเองทุก 60 วินาที

## ขั้นที่ 6 · ทดสอบ

ทดสอบ API ด้วย PowerShell ก่อน แล้วค่อยลองบนมือถือ (แทน DOMAIN ด้วยโดเมน ngrok ของคุณ)

```
curl.exe -s "https://DOMAIN/webhook/hotel?check_in=2026-10-10&check_out=2026-10-12&adults=2&promo=WELCOME10" -H "ngrok-skip-browser-warning: 1"
curl.exe -s "https://DOMAIN/webhook/admin" -H "X-Staff-Key: รหัสพนักงาน" -H "ngrok-skip-browser-warning: 1"
curl.exe -s -X POST "https://DOMAIN/webhook/booking" -H "Content-Type: application/json" --data-binary "@test-booking-v2.json"
```

| คำสั่ง | ผลที่ควรได้ |
| --- | --- |
| hotel | success true และ rooms มี available, subtotal, discount, total เช่น Deluxe 5,400 ลด 540 เหลือ 4,860 (คืนวันเสาร์คิดราคา weekend) |
| admin | success true พร้อม bookings, rooms · รหัสผิดได้ 403 Authorization data is wrong! |
| booking | success true, booking\_id, price\_total 4860, discount 540 และแถวใหม่ใน Bookings ครบ Q:AD |

คำสั่ง booking ต้องแก้ line\_user\_id ใน test-booking-v2.json เป็น userId ของคุณ และตั้ง require\_id\_token = FALSE ในชีต Config ชั่วคราว (curl ไม่มี id\_token ของ LINE) ทดสอบเสร็จแล้วเปลี่ยนกลับเป็น TRUE

ลำดับทดสอบบนมือถือ:

1. เมนูจองห้องใน LINE → เลือกวัน → ใส่ WELCOME10 → เห็นราคาขีดฆ่าและราคาหลังหัก → จอง → ได้ใบยืนยันที่มีแยกค่าห้อง ส่วนลด ยอดชำระ และกลุ่มแม่บ้านได้ "การจองใหม่ · เตรียมห้อง"
2. กด "การจองของฉัน" → การ์ดมีปุ่มยกเลิก (เฉพาะก่อนหมดเวลายกเลิกฟรี) ลองยกเลิกแล้วดูสถานะในชีต
3. จองใหม่ที่เข้าพักวันนี้ → admin.html → เช็กอิน → เช็กเอาต์ → กลุ่มแม่บ้านได้ข้อความทำความสะอาด → กด "ห้องพร้อมแล้ว ✅" → ผังห้องใน admin เป็นสีเขียว
4. หน้าหลังบ้าน → บันทึกการจอง → Walk-in เช็กอินทันที และ Agoda ใส่ราคา OTA เอง → ห้องว่างบนหน้าจองลดลงทันที
5. Workflow F และ E v2: เปิด workflow → Execute workflow เพื่อทดสอบได้ทันทีไม่ต้องรอ 09:00 และ 10:00

คะแนนคืนแรก (C) ส่ง 20:00 ให้การจองสถานะ Checked-in ที่เข้าพักวันนี้ ใน v2 สถานะนี้มาจากปุ่มเช็กอินในหน้าหลังบ้าน ไม่ต้องแก้ในชีตแล้ว

## แก้ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
| --- | --- | --- |
| Save Booking: Column names were updated after the node's setup | ชีต Bookings ขาดคอลัมน์ v2 | วางหัวคอลัมน์ Q1:AD1 ให้ครบ ชื่อต้องตรงทุกตัวอักษร |
| Read Sheets ได้ 401 หรือ 403 | Google Sheets SA ยังไม่เปิดใช้กับ HTTP Request หรือไม่มี Scope | ทำตามขั้นที่ 2 |
| Read Sheets ได้ 404 Requested entity was not found | Spreadsheet ID ผิด | แทน YOUR\_SPREADSHEET\_ID ใหม่ |
| Read Sheets ได้ 400 Unable to parse range | ชื่อแท็บไม่ตรง | ต้องมี Config, Bookings, RoomTypes, Rooms, Promos, Offers, Messages, ActivityLog |
| Publish แล้ว error เรื่อง webhook ชนกัน | A หรือ B เดิมยัง Publish อยู่ | Unpublish ของเดิมก่อน |
| หน้าจอง: เชื่อมต่อระบบจองไม่ได้ | n8n หรือ ngrok ปิด, N8N\_BASE\_URL ผิด หรือ Allowed Origins ไม่ตรง | Allowed Origins ต้องเป็น https://ชื่อผู้ใช้.github.io ไม่มี / ปิดท้าย |
| หน้าจอง: ไม่พบระบบข้อมูลห้องพัก | Q ยังไม่ Publish | Publish Q - Hotel API |
| หลังบ้าน: รหัสพนักงานไม่ถูกต้อง | รหัสไม่ตรง Value หรือ credential ชื่อผิด | ตรวจ Staff Key (Name X-Staff-Key) ใน node Staff API |
| ห้องขึ้นว่าเต็มทั้งที่ว่าง | ไม่มีแถวใน Rooms หรือ room\_type สะกดไม่ตรง หรือห้องเป็น Out of Order | ตรวจชีต Rooms |
| กลุ่มแม่บ้านไม่ได้ข้อความ | housekeeping\_group\_id ว่าง, สวิตช์ปิด หรือโควตาหมด | ขั้นที่ 4 และหน้าหลังบ้าน → ตั้งค่า (หน้าหลังบ้านเตือนเมื่อ LINE ส่งไม่สำเร็จ) |
| เชิญบอทเข้ากลุ่มแล้วไม่มีการ์ด | ยังไม่เปิดอนุญาตเข้ากลุ่ม หรือ B v2 ยังไม่ Publish | ขั้นที่ 4 ข้อ 1 แล้วเชิญใหม่ |
| แขกกดยกเลิกใน LINE ไม่ได้ | เลยเวลายกเลิกฟรี (free\_cancel\_days) | พนักงานยกเลิกให้ในหน้าหลังบ้าน |
| ล็อกอิน LINE บนเว็บแล้ว error | เปิดหน้าเว็บคนละ URL กับ LIFF Endpoint URL | เปิดด้วย URL เดียวกับ Endpoint ทุกตัวอักษร |
| รูปไม่ขึ้น | URL ผิด ไม่ใช่ https หรือไม่มีไฟล์ใน repo | หน้าเว็บแสดงกรอบ "โหลดรูปไม่สำเร็จ" แทน ตรวจ URL ในชีต |

ข้อจำกัดที่เหลือ: ยังไม่มีการชำระเงินออนไลน์ แขกชำระที่โรงแรม ส่วนลดหักบนหน้าเว็บและบันทึกยอดสุทธิไว้ในการจองแล้ว
