# 🏨 Sai Lan Hotel v2

**ระบบดูแลผู้เข้าพักอัตโนมัติเต็มวงจร (Automated Guest Journey)**

> *จอง → ยืนยัน LINE → เตรียมห้อง → ถามน้องใส (AI) ได้ตลอด 24 ชม. → ประเมิน → AI สรุปความชอบ → ดีลส่วนตัวดึงกลับมา → รายงาน PDF ให้เจ้าของทุกเดือน*

> 📚 โปรเจกต์รายวิชา · ทุกส่วนใช้บริการฟรี (free tier / โอเพนซอร์ส) · รูปห้องในหน้าเว็บเป็นรูปตัวอย่างจาก Unsplash ไม่ใช่รูปโรงแรมจริง ([เครดิตรูป](IMAGE_CREDITS.md))

---

## 📑 สารบัญ

1. [Concept & ที่มา](#1-concept--ที่มา)
2. [ปัญหาที่แก้](#2-ปัญหาที่แก้)
3. [เป้าหมาย](#3-เป้าหมาย)
4. [Solution ภาพรวม](#4-solution-ภาพรวม)
5. [Tech Stack](#5-tech-stack)
6. [สถาปัตยกรรม](#6-สถาปัตยกรรม)
7. [Workflows ทั้ง 10](#7-workflows-ทั้ง-10)
8. [Flow การทำงาน](#8-flow-การทำงาน)
9. [การใช้ LLM (Gemini)](#9-การใช้-llm-gemini)
10. [ฐานข้อมูล Google Sheets](#10-ฐานข้อมูล-google-sheets)
11. [การติดตั้ง](#11-การติดตั้ง)
12. [การใช้งาน](#12-การใช้งาน)
13. [Roadmap](#13-roadmap)
14. [ค่าใช้จ่าย](#14-ค่าใช้จ่าย)
15. [License](#15-license)

---

## 1. Concept & ที่มา

### 🏨 โรงแรมขนาดเล็ก-กลาง (Boutique / Homestay) มักเจอปัญหานี้

- **พนักงาน 5 คน** ทำงานซ้ำ ๆ ทุกวัน: ตอบ LINE แขก, ส่ง WiFi, เตือนเช็กเอาต์, ตามรีวิว, ดึงลูกค้าเก่ากลับ
- **ไม่มีระบบ CRM** — ลูกค้าเก่า 70% หายไป
- **ซอฟต์แวร์โรงแรม (PMS)** มีราคา 1,500–15,000 บาท/เดือน โรงแรมเล็กจ่ายไม่ไหว

### 💡 แนวคิด

> สร้าง **"พนักงานเสมือน"** ที่ทำงาน 24 ชั่วโมง ด้วยเครื่องมือที่เจ้าของโรงแรมมีอยู่แล้ว
> ในราคา **0 บาท/เดือน** เพื่อให้แขกรู้สึกว่า *"ที่นี่ดูแลฉันเป็นพิเศษ"* ทุกครั้งที่กลับมา

---

## 2. ปัญหาที่แก้

| # | ปัญหา | ผลกระทบ |
|---|---|---|
| 1 | พนักงานตอบ LINE ซ้ำ ("WiFi รหัสอะไร", "เช็กอินกี่โมง") | เสียเวลา 2-3 ชม./วัน |
| 2 | ไม่มี CRM — ลูกค้าเก่าหายเงียบ | ต้นทุนหาลูกค้าใหม่สูงกว่าดึงลูกค้าเก่า 5-7 เท่า |
| 3 | PMS มีราคาสูง | โรงแรมเล็กส่วนใหญ่ใช้ Excel + LINE อย่างเดียว |

---

## 3. เป้าหมาย

### 🎯 สำหรับเจ้าของโรงแรม
- ลดงานซ้ำ ๆ ของพนักงาน → ให้พนักงานดูแลหน้างานจริง
- ดึงลูกค้าเก่ากลับมา 15-25%
- ข้อมูลรวมศูนย์ใน Sheets กลาง ตรวจสอบได้ 100%

### 🎯 สำหรับแขก
- ได้ WiFi/แผนที่/เวลาเช็กอินทันทีหลังจอง (ไม่ต้องรอ)
- ตอบ LINE ตลอด 24 ชม. (ไม่ต้องรอพนักงานตื่น)
- ครั้งหน้าได้ห้อง/หมอน/กาแฟที่ตรงใจ

### 🎯 สำหรับพนักงาน
- ไม่ต้องจำรหัส WiFi, ไม่ต้องนับห้องว่าง
- แม่บ้านได้รับแจ้งเตือนเตรียมห้องอัตโนมัติ
- มีหลังบ้าน (admin.html) กดปุ่มเดียวจบ

---

## 4. Solution ภาพรวม

### สัญญาของเรา
- ✅ **ครบวงจร** — จอง → ต้อนรับ → ตอบ LINE → ประเมิน → ดึงกลับ
- ✅ **ใช้เครื่องมือที่มีอยู่แล้ว** — LINE OA + Google Sheets + Gemini AI
- ✅ **0 บาท/เดือน** — ทุกอย่างใช้ free tier
- ✅ **ติดตั้งใน 1 วัน** — ไม่ต้องเปลี่ยน workflow พนักงาน

### 🗺️ ภาพรวมการเดินทางของแขก 1 คน

```
   จอง        เตรียมห้อง     ทัก LINE/เว็บ      ประเมิน       AI สรุป       ดีลกลับ
   (A)           (F)          (B + G AI)        (C)           (D)          (E)
       │            │             │              │             │            │
       ▼            ▼             ▼              ▼             ▼            ▼
   ─────────────────────────────────────────────────────────────────────────────
                          n8n (ตัวกลางทำงานอัตโนมัติ)
   ─────────────────────────────────────────────────────────────────────────────
       │            │             │              │             │            │
       ▼            ▼             ▼              ▼             ▼            ▼
   📊 Google Sheets (ฐานข้อมูลกลาง 10 ชีต — แก้ไขได้จาก Excel)

   ทุกวันที่ 1 → Workflow R สรุปเดือนที่แล้วเป็น PDF ส่งเจ้าของทางอีเมล + LINE
```

---

## 5. Tech Stack

```
┌──────────────────────────────────────────────┐
│  Frontend       HTML/CSS/Vanilla JS          │
│                 (ไม่มี framework = ฟรี/เร็ว) │
├──────────────────────────────────────────────┤
│  Automation     n8n (โอเพนซอร์ส workflow)   │
│                 (โค้ดต่ำ ดูแลง่าย)          │
├──────────────────────────────────────────────┤
│  Database       Google Sheets                │
│                 (ไม่ต้องเรียน SQL, ส่งออกได้)│
├──────────────────────────────────────────────┤
│  Messaging      LINE Official Account        │
│                 (คนไทยใช้ LINE 95%+)        │
├──────────────────────────────────────────────┤
│  AI             Gemini 3.5 Flash Lite        │
│                 (ฟรี + ฉลาดพอ + เร็ว)        │
├──────────────────────────────────────────────┤
│  PDF            Gotenberg (โอเพนซอร์ส)       │
│                 (แปลง HTML → PDF ใน Docker)  │
├──────────────────────────────────────────────┤
│  Testing        Node test + Playwright       │
│                 (รันอัตโนมัติบน GitHub Actions)│
└──────────────────────────────────────────────┘
```

### Design Principles
1. **Free first** — ทุก component ต้องมี free tier ที่ใช้งานได้จริง
2. **No vendor lock-in** — ข้อมูลอยู่ใน Sheets ย้ายไปไหนก็ได้
3. **Staff can edit** — พนักงานเปิด Sheets แก้ไขได้ทันที ไม่ต้องผ่าน dev
4. **Audit trail** — ทุก action มี log ใน ActivityLog

---

## 6. สถาปัตยกรรม

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Static site)                                          │
│  • index.html      → หน้าจอง + ดูห้อง + แชท "ถามน้องใส"           │
│  • admin.html      → หลังบ้านพนักงาน (Staff Key) อัปเดตสดทุก 20 วิ │
│  • config.js       → URL ของ n8n + LIFF ID (ใช้ร่วมกันทั้งสองหน้า) │
│  • demo-images.js  → รูปตัวอย่างห้องจาก Unsplash                  │
│  • ทั้งหมดฝากบน GitHub Pages (free)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS (https://<NGROK_DOMAIN>/webhook/...)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  ngrok (โดเมนคงที่ฟรี) → n8n self-hosted ใน Docker (docker-compose) │
│  ┌────────────┬────────────┬────────────┬────────────┬─────────┐│
│  │ Q: Hotel   │ A: Booking │ B: LINE    │ S: Staff   │ G: AI   ││ Webhook
│  │ API        │ v2         │ Router v2  │ API        │ Chatbot ││
│  ├────────────┼────────────┼────────────┼────────────┼─────────┤│
│  │ C: Rating  │ D: AI      │ E: Re-     │ F: Daily   │ R: PDF  ││ Cron
│  │ 20:00      │ Summary    │ booking    │ Ops 09:00  │ รายเดือน ││
│  └────────────┴────────────┴────────────┴────────────┴─────────┘│
│  Gotenberg (container ในเครื่อง) ← R ส่ง HTML ไปแปลงเป็น PDF      │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┬────────────────┐
        ▼                ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Google       │ │ LINE Official│ │ Gemini API   │ │ Gmail SMTP   │
│ Sheets 1 file│ │ Account      │ │ 3.5 Flash    │ │ (ส่งรายงาน   │
│ 10 ชีต       │ │ (Push+Reply) │ │ Lite (free)  │ │  PDF ฟรี)     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 7. Workflows ทั้ง 10

ไฟล์ `workflow-*.json` ทั้ง 10 ไฟล์อยู่ที่ root ของ repo (export จาก n8n)

| ID | Workflow | Trigger | Auth | ใครใช้ | หน้าที่ |
|---|---|---|---|---|---|
| **Q** | Hotel API | Webhook GET | none | แขก (เว็บ) | ตอบ {ห้องว่าง, ราคา, โปรโม} |
| **A** | Booking v2 | Webhook POST | LINE id_token | แขก (จอง) | ตรวจสอบ → จอง → Push LINE ยืนยัน + แจ้งแม่บ้าน |
| **B** | LINE Router v2 | Webhook POST | LINE signature | ทุกคน (LINE) | ตอบปุ่มเมนู LINE + อัปเดตสถานะห้อง + บันทึกทุกแชท · ข้อความพิมพ์อิสระส่งต่อให้ G ตอบ |
| **C** | Rating | Cron 20:00 | - | - | ส่ง "⭐ ให้คะแนน" หลังเช็กอิน 1 คืน |
| **D** | AI Summary | Cron hourly | - | - | 💎 Gemini สรุป preference_tags (ทุกชั่วโมง นาทีที่ 15) |
| **E** | Re-booking | Cron 10:00 | - | - | ส่งข้อเสนอส่วนตัว (ใช้ tags จาก D) |
| **F** | Daily Ops | Cron 09:00 | - | - | Welcome แขก + Digest แม่บ้าน |
| **S** | Staff API | Webhook GET/POST | Staff Key | พนักงาน | เช็กอิน/เอาต์, แก้ห้อง, ส่ง push |
| **G** | AI Concierge | Webhook POST | none (CORS) | แขก (LINE + เว็บ) | 🤖 แชทบอท Gemini ตอบคำถามจากข้อมูลในชีต · [คู่มือ](คู่มือติดตั้ง%20AI%20Chatbot.md) |
| **R** | Monthly Report PDF | Cron วันที่ 1 08:00 + Webhook GET | Staff Key | เจ้าของ | สรุปเดือนที่แล้วเป็น PDF → อีเมล + สรุปสั้นทาง LINE ([คู่มือ](คู่มือติดตั้ง%20รายงานรายเดือน%20(Workflow%20R).md)) |

---

## 8. Flow การทำงาน

### ขั้นที่ 1: ก่อนจอง → Workflow Q

```
👤 เปิด index.html
   └─► JS เรียก GET /webhook/hotel
       └─► Q: อ่าน Sheets (Config, RoomTypes, Promos)
           └─► ตอบ JSON {ห้องว่าง, ราคา, โปรโม}
```

### ขั้นที่ 2: จองห้อง → Workflow A

```
👤 กรอกฟอร์ม + ยืนยัน LINE (LIFF → id_token)
   └─► POST /webhook/booking
       └─► A: Read Sheets (Bookings/Rooms/Config)
            ├─► Validate (200+ บรรทัด)
            │   • ตรวจเบอร์/อีเมล
            │   • กันจองซ้ำ 48 ชม. (client_request_id)
            │   • คำนวณราคา (weekend)
            │   • ตรวจโค้ดส่วนลด
            │   • เลือกห้องอัตโนมัติ
            ├─► Verify LINE id_token (api.line.me/oauth2/v2.1)
            ├─► Save Booking → Bookings
            ├─► Upsert Customer → Customers
            ├─► Log Activity → ActivityLog
            ├─► Push LINE (Flex ยืนยันการจอง) → แขก
            └─► Push LINE (เตรียมห้อง 204) → แม่บ้าน
            └─► ตอบ {booking_id, price}
```

### ขั้นที่ 3: ก่อนวันเข้าพัก → Workflow F (Cron 09:00)

```
⏰ ทุกเช้า 09:00 (Asia/Bangkok)
   └─► F: หา booking ที่ check_in = วันนี้
       ├─► Push Welcome (WiFi, เวลาเช็กอิน, แผนที่) → แขก
       └─► Push Digest (ใครเข้าพัก + ห้องที่ต้องเตรียม) → กลุ่มแม่บ้าน
```

### ขั้นที่ 4: ระหว่างเข้าพัก → Workflow B + C

```
👤 แขกทัก LINE ตลอด 24 ชม.
   └─► B (LINE Router):
       ├─► Log Message → Messages sheet
       ├─► (ถ้า postback hk_start/hk_done) Update Room hk_status:
       │   Dirty → Cleaning → Clean
       ├─► Reply/Push LINE (กลับไปแขก/แม่บ้าน)
       └─► (ถ้าแขกพิมพ์คำถามเอง) ส่งต่อ G → 🤖 น้องใส (Gemini) ตอบจากข้อมูลในชีต
           └─► ตอบไม่ได้ → แจ้งกลุ่มพนักงานใน LINE ให้มาตอบต่อ

👤 แขกในหน้าเว็บกด "ถามน้องใส"
   └─► POST /webhook/chat → G ตอบในหน้าต่างแชททันที

⏰ ทุกคืน 20:00
   └─► C: หาแขกเช็กอินเมื่อวาน + ยังไม่ให้ rating
       └─► Push "⭐ ประเมินคืนแรก" 1-5 ดาว
           └─► แขกกดดาว → B → Update Bookings.rating
```

### ขั้นที่ 5: หลังเช็กเอาต์ → Workflow D (Cron hourly)

```
⏰ ทุก ๆ 1 ชม.
   └─► D: หา Checked-out ที่ยังไม่มี preference_tags
       └─► Read Messages ทั้งหมด
           └─► Build Prompt
               └─► 💎 Gemini 3.5 Flash Lite
                   └─► Parse Tags (fallback 4 ชั้น)
                       ├─► Save → Bookings.preference_tags
                       └─► Save → Customers.last_preference_tags
```

### ขั้นที่ 6: กลับมาพักอีก → Workflow E (Cron 10:00)

```
⏰ ทุกเช้า 10:00
   └─► E: หาลูกค้าที่เคยมา + มี tags + lifetime สูง
       └─► สร้างดีลส่วนตัว (Offers sheet)
           └─► Push Flex สวย ๆ (ห้องที่ชอบ + ส่วนลด) → แขก
               └─► แขกกด "จองเลย" → วนกลับ Workflow A
```

### ขั้นพิเศษ: ตลอดเวลา → Workflow S (Staff API)

```
👨‍💼 พนักงานใช้ admin.html
   └─► GET /admin (Staff Key) → snapshot ทั้งระบบ
   └─► POST /admin {action: ...}
       ├─► update_booking (เช็กอิน/เอาต์/แก้สถานะ)
       ├─► append_booking (walk-in)
       ├─► update_rooms (เปลี่ยน hk_status)
       ├─► update_config (แก้ค่าตั้ง)
       └─► push_messages (ส่ง LINE หาแขก/สตาฟ)
   (หน้า admin ดึง snapshot ใหม่เองทุก 20 วินาที ไม่ต้องรีโหลด
    ถ้าไม่มีการใช้งาน 3 นาทีจะช้าลงเหลือทุก 60 วินาที)
```

### ขั้นพิเศษ: ทุกวันที่ 1 → Workflow R (รายงานรายเดือน)

```
⏰ วันที่ 1 ของทุกเดือน 08:00
   └─► R: อ่าน Bookings / Rooms / Customers / Offers ของเดือนที่แล้ว
       ├─► คำนวณรายได้, อัตราการเข้าพัก, คะแนนรีวิว ฯลฯ
       ├─► ส่ง HTML ไป Gotenberg → ได้ PDF 1 หน้า A4
       ├─► อีเมล PDF ถึงเจ้าของ (Gmail SMTP)
       └─► Push สรุปตัวเลขสั้น ๆ ทาง LINE ถึงเจ้าของ
👨‍💼 พนักงานดาวน์โหลดเดือนไหนก็ได้: GET /webhook/report (Staff Key)
```

---

## 9. การใช้ LLM (Gemini)

### 🎯 ทำไมต้องมี LLM?

> **"ระบบอัตโนมัติทั่วไปตอบได้แค่ปุ่มเมนูตายตัว — เราต้องการให้ระบบ (1) 'จำ' ว่าแขกชอบอะไร เพื่อเอาไปทำดีลกลับมาให้เหมือนคนดูแลเอง และ (2) ตอบคำถามอิสระของแขกได้ถูกต้องจากข้อมูลจริงของโรงแรม"**

ระบบใช้ Gemini **2 จุด**: Workflow D (สรุปความชอบ) และ Workflow G (แชทบอทน้องใส) ทั้งคู่ใช้ API key ฟรีจาก Google AI Studio

### 📍 จุดที่ 1 — Workflow D: สรุปความชอบของแขก

```
📨 แชททั้งหมดของแขก (5-50 ข้อความ)
                │
                ▼
       ┌────────────────────┐
       │  Build Prompt       │  รวมแชท + กติกา
       └──────────┬─────────┘
                  ▼
       ┌────────────────────┐
       │  Has Messages?      │  ถ้าไม่มี → ข้าม (ไม่เรียก)
       └──────────┬─────────┘
                  ▼
       ╔════════════════════╗
       ║ 💎 Gemini 3.5      ║  ← LLM จุดที่ 1
       ║   Flash Lite       ║     (โมเดลเล็ก ฟรี)
       ║   Temperature 0.2 ║
       ║   JSON mode        ║
       ╚════════╤═══════════╝
                ▼
       ┌────────────────────┐
       │  Parse + Sanitize  │  fallback 4 ชั้น
       └──────────┬─────────┘
                  ▼
   📊 tags → Google Sheets (Bookings + Customers)
```

### 📝 Prompt (อยู่ใน Code node "Build Prompt")

```
กติกา:
1. ตอบเป็น JSON เท่านั้น รูปแบบ {"tags": ["...", "..."]} ห้ามมีข้อความอื่น
2. แต่ละ tag เป็นภาษาไทย สั้น กระชับ ไม่เกิน 6 คำ
3. สูงสุด 5 tags เฉพาะสิ่งที่นำไปใช้บริการครั้งหน้าได้
4. ห้ามใส่ชื่อ เบอร์โทร อีเมล หรือข้อมูลส่วนตัว ห้ามเดาสิ่งที่แขกไม่ได้พูด
5. ถ้าข้อมูลไม่พอ ให้ตอบ {"tags": []}
```

### 🎯 ตัวอย่าง Input → Output

**Input (แชทจริง):**
```
[แขก] สวัสดีครับ เช็กอินตอน 14.00 ได้ไหม
[บอท] ได้เลยครับ 😊
[แขก] ขอ WiFi หน่อย
[บอท] SaiLan_Guest / รหัส 1234
[แขก] แฟนผมแพ้หมอนขนเป็ดครับ เปลี่ยนได้มั้ย
[บอท] เปลี่ยนเป็นใยสังเคราะห์ให้แล้วค่ะ
[แขก] ห้องเงียบมาก ชอบเลย
[แขก] กาแฟเช้าอ่อนไปหน่อยนะ
[บอท] บันทึกไว้ให้แล้วค่ะ
[แขก] ขอเช็กเอาต์ตอนเที่ยงตรง ๆ พร้อมใบเสร็จด้วย
```

**Output (Gemini สรุป):**
```json
{
  "tags": [
    "แพ้หมอนขนเป็ด",
    "ชอบห้องเงียบ",
    "กาแฟเข้มข้น",
    "ขอใบเสร็จตอนเช็กเอาต์"
  ]
}
```

**จากนั้น Workflow E เอาไปใช้:**
> "สวัสดีคุณลูกค้าเก่า ห้อง Quiet ที่คุณชอบยังว่างสัปดาห์หน้า ลด 15% และจะเตรียมหมอนใยสังเคราะห์ + กาแฟเข้มให้ค่ะ"

### 🛡️ การ์ดความปลอดภัย (ทำไมเชื่อถือได้)

| Layer | ทำอะไร | ผลลัพธ์ |
|---|---|---|
| **System prompt** | สั่ง "ตอบ JSON เท่านั้น, ห้ามใส่ชื่อ/เบอร์/อีเมล" | Gemini ตอบตรง format |
| **Temperature 0.2** | ต่ำ → ตอบเหมือนเดิม input เดิม | Reproducible |
| **JSON mode** | บังคับ output เป็น JSON | ไม่ต้อง parse prose |
| **Parse fallback 4 ชั้น** | ถ้า Gemini ตอบผิด → JSON → strip ``` → regex → split lines | ไม่ crash flow |
| **Sanitize** | `Set` dedup + trim + slice 40 chars + filter empty | tags สะอาด |
| **onError** | `continueRegularOutput` → ข้าม booking นี้ไปทำตัวอื่น | quota เต็มก็ไม่ block |
| **Quota check** | ถ้าไม่มีแชท → ไม่เรียก Gemini | ประหยัด free tier |

### 💎 ใช้ที่ไหนบ้าง

| | จำนวน |
|---|---|
| **Workflow ที่ใช้** | 2 (D - Preference Summary, G - AI Concierge) |
| **Model** | `gemini-3.5-flash-lite` (D ตั้งใน node "Gemini Flash" · G อ่านจากค่า `ai_model` ในชีต Config) |
| **เรียกบ่อยแค่ไหน** | D: cron ทุก 1 ชม. × เฉพาะ booking ที่ Checked-out + ยังไม่มี tags · G: 1 ครั้งต่อ 1 คำถามที่แขกพิมพ์ |
| **Output ใช้ที่ไหน** | D: เก็บใน Sheets → Workflow E อ่านไปทำดีลส่วนตัว · G: ตอบแขกทันทีใน LINE / หน้าเว็บ |
| **ค่าใช้จ่าย** | ~0 บาท (Free tier) |

### 🤖 จุดที่ 2 — Workflow G: AI Chatbot (น้องใส)

แขกพิมพ์คำถามอิสระใน LINE OA (B ส่งต่อมาให้) หรือในหน้าเว็บ (ปุ่ม "ถามน้องใส") → G อ่านชีต Config · RoomTypes · Rooms · FAQ ล่าสุด → แนบเป็น "คลังความรู้" ให้ Gemini → ตอบเป็น JSON `{answer, handoff}`

- ตอบจากข้อมูลในชีตเท่านั้น ไม่มีข้อมูล = บอกว่าไม่ทราบ + ส่งต่อพนักงาน (แจ้งกลุ่มพนักงานใน LINE)
- ไม่ส่งรหัส WiFi / ข้อมูลแขกคนอื่นให้ AI · โควตาเต็มมีข้อความสำรอง
- ปุ่มเมนู LINE เดิมยังตอบแบบกฎตายตัวเหมือนเดิม
- พนักงานเพิ่ม/แก้คำตอบได้เองในชีต FAQ (ตัวอย่างหัวตารางอยู่ใน `faq-sheet-template.csv`) ไม่ต้องแก้โค้ด

ดูวิธีติดตั้งที่ [คู่มือติดตั้ง AI Chatbot](คู่มือติดตั้ง%20AI%20Chatbot.md)

---

## 10. ฐานข้อมูล Google Sheets

**1 ไฟล์ / 10 ชีต** เป็น Single Source of Truth

| # | ชีต | ใช้โดย | คำอธิบาย |
|---|---|---|---|
| 1 | **Config** | Q, A, B, E, F, G, R, S | ค่าตั้ง (รหัส WiFi, แผนที่, เวลาเช็กอิน/เอาต์, ส่วนลด, `ai_model`, อีเมลรับรายงาน) |
| 2 | **RoomTypes** | Q, A, E, F, G, R, S | ประเภทห้อง (เช่น Superior, Deluxe, Suite) + ราคา + สิ่งอำนวยความสะดวก + รูป |
| 3 | **Rooms** | Q, A, B, F, G, R, S | ห้องแต่ละห้อง (101, 102, ... + hk_status: Dirty/Cleaning/Clean) |
| 4 | **Promos** | Q, A, E, S | โค้ดส่วนลด / โปรโมชันที่แสดงหน้าเว็บ |
| 5 | **Bookings** | Q, A, B, C, D, E, F, R, S | การจอง (booking_id, customer, วันที่, ราคา, status, rating, tags) |
| 6 | **Customers** | A, D, E, R, S | ลูกค้า (line_user_id, full_name, lifetime_spent, last_preference_tags) |
| 7 | **Messages** | B, D, S | ทุกข้อความ LINE ที่เข้า-ออก |
| 8 | **Offers** | Q, A, E, R, S | ดีลส่วนตัวที่ส่ง (status: pending/claimed/expired) |
| 9 | **ActivityLog** | B, F, R, S | Audit log ทุก action |
| 10 | **FAQ** | G | คำถามที่พบบ่อยที่พนักงานเขียนเอง (question, answer, category, active) ให้ AI ใช้ตอบ |

### หลักการ
- พนักงานเปิด Sheets แก้ไขได้ทันที
- Audit trail ครบใน ActivityLog
- ส่งออก CSV/Excel ได้ตรง ๆ
- Backup ในตัว (Google Drive history)

---

## 11. การติดตั้ง

ระบบรัน n8n แบบ **self-hosted ด้วย Docker** บนเครื่องของเราเอง แล้วใช้ **ngrok** เปิดให้หน้าเว็บและ LINE เรียก webhook จากอินเทอร์เน็ตได้ (ไม่ได้ใช้ n8n Cloud) ขั้นตอนละเอียดทีละคลิกอยู่ใน [คู่มือติดตั้ง Sai Lan Hotel v2.md](คู่มือติดตั้ง%20Sai%20Lan%20Hotel%20v2.md)

### Prerequisites
- Docker Desktop (หรือ Docker Engine + Compose v2)
- บัญชี ngrok (free) พร้อม Authtoken และโดเมนคงที่ 1 โดเมน (Dashboard → Domains)
- Google Sheets 1 ไฟล์ + Google Service Account
- LINE Official Account + Messaging API และ LINE Login channel (สำหรับ LIFF)
- Gemini API Key (free tier จาก Google AI Studio) ใช้กับ Workflow D และ G
- บัญชี Gmail + App Password (สำหรับส่งรายงาน PDF ของ Workflow R)
- GitHub Pages (free) สำหรับ frontend

### Steps

```bash
# 1. Clone repo
git clone https://github.com/Nestyzxc/hotel-booking.git
cd hotel-booking

# 2. ตั้งค่า ngrok แล้วเปิด n8n + ngrok
cp .env.example .env        # แล้วใส่ NGROK_DOMAIN และ NGROK_AUTHTOKEN
docker compose up -d
#    n8n บนเครื่อง:   http://localhost:5678
#    n8n จากภายนอก:  https://<NGROK_DOMAIN>/
#    Gotenberg (สร้าง PDF) รันในเครือข่ายภายในที่ http://gotenberg:3000 ไม่เปิด port ออกนอกเครื่อง

# 3. Import 10 workflows เข้า n8n (Workflows → Import from file)
#    (ไฟล์ใน repo ผูก Spreadsheet ID ของโปรเจกต์ไว้แล้ว ถ้าใช้ชีตของตัวเองให้แทน ID ในไฟล์ก่อน import ดูคู่มือ)
#    - workflow-q-hotel-api.json
#    - workflow-a-booking-v2.json
#    - workflow-b-line-router-v2.json
#    - workflow-c-first-night-rating.json
#    - workflow-d-preference-summary.json
#    - workflow-e-rebooking-offer-v2.json
#    - workflow-f-daily-operations.json
#    - workflow-s-staff-api.json
#    - workflow-g-ai-concierge.json    (แชทบอทน้องใส · ต้องมีชีต FAQ)
#    - workflow-r-monthly-report.json  (รายงาน PDF · ใช้ service gotenberg ใน docker-compose)

# 4. สร้าง Credentials ใน n8n (ชื่อต้องตรงทุกตัวอักษร ดูคู่มือขั้นที่ 2)
#    - Google Sheets SA     (Google Service Account API)
#    - LINE Channel Token   (Header Auth)
#    - Staff Key            (Header Auth, Name = X-Staff-Key)
#    - Google Gemini API    (สร้างแล้วเลือกเองใน node "Gemini Flash" ของ Workflow D)
#    - Gemini API Key       (Header Auth, Name = x-goog-api-key · ใช้ใน Workflow G)
#    - SMTP Report          (SMTP ของ Gmail + App Password · ใช้ใน Workflow R)

# 5. แก้ config.js ไฟล์เดียว แล้ว push ขึ้น GitHub Pages
#    - N8N_BASE_URL     = https://<NGROK_DOMAIN>/webhook
#    - LIFF_ID          = LIFF ID จาก LINE Login channel
#    - LINE_OA_BASIC_ID = Basic ID ของ OA เช่น @123abcde
#    (index.html และ admin.html อ่านค่าจาก config.js ไม่ต้องแก้ไฟล์ HTML)
```

คู่มือเพิ่มเติมแยกตามส่วน:
- [คู่มือติดตั้ง AI Chatbot.md](คู่มือติดตั้ง%20AI%20Chatbot.md) — Workflow G + ชีต FAQ + ค่า Config ของแชทบอท
- [คู่มือติดตั้ง รายงานรายเดือน (Workflow R).md](คู่มือติดตั้ง%20รายงานรายเดือน%20(Workflow%20R).md) — Gotenberg + อีเมล + LINE เจ้าของ

### ค่าตั้งค่าอยู่ที่ไหน

| ค่า | อยู่ที่ | ลับไหม |
|---|---|---|
| `NGROK_DOMAIN`, `NGROK_AUTHTOKEN` | `.env` (อ่านโดย `docker-compose.yml`, ไม่ commit) | Authtoken เป็นค่าลับ |
| `N8N_BASE_URL`, `LIFF_ID`, `LINE_OA_BASIC_ID` | `config.js` | ไม่ลับ (เบราว์เซอร์เห็นอยู่แล้ว) |
| LINE Channel Access Token, Staff Key, Gemini API Key, Service Account, รหัส SMTP | Credentials ใน n8n | ลับ ห้ามใส่ในไฟล์ใน repo |
| ข้อมูลโรงแรม ราคา ห้อง รูป, `housekeeping_group_id`, `ai_model`, อีเมลรับรายงาน | Google Sheets (ชีต Config / RoomTypes) | ไม่ลับ |
| คำถาม-คำตอบของแชทบอท | Google Sheets (ชีต FAQ) | ไม่ลับ |

> ถ้าเปลี่ยนโดเมน ngrok ต้องแก้ 3 ที่ให้ตรงกัน: `NGROK_DOMAIN` ใน `.env`, `N8N_BASE_URL` ใน `config.js` และ Webhook URL ใน LINE Developers

---

## 12. การใช้งาน

### 👤 สำหรับแขก
1. เปิด https://nestyzxc.github.io/hotel-booking/
2. ดูห้องว่าง + ราคา
3. กรอกฟอร์ม + ยืนยัน LINE
4. ได้รับ Flex ยืนยันการจองทันที
5. ถาม "น้องใส" ได้ตลอด 24 ชม. ทั้งในหน้าเว็บและใน LINE
6. ให้คะแนน 1-5 ดาวหลังเช็กอิน 1 คืน
7. รอดีลส่วนตัวครั้งหน้า

### 👨‍💼 สำหรับพนักงาน
1. เปิด https://nestyzxc.github.io/hotel-booking/admin.html
2. ใส่ Staff Key
3. ดู dashboard: ห้องว่าง, booking วันนี้, สถานะ housekeeping (อัปเดตสดทุก 20 วินาที ไม่ต้องกดรีเฟรช)
4. กดปุ่มเช็กอิน/เอาต์
5. เปลี่ยนสถานะห้อง
6. ส่ง push ถึงแขก/แม่บ้าน

### 🛏️ สำหรับแม่บ้าน
1. รับแจ้งเตือนจาก LINE ทุกเช้า 09:00 (Digest)
2. ทำความสะอาด + กด "Cleaning Done" ใน LINE
3. ระบบอัปเดตสถานะห้องอัตโนมัติ

### 📈 สำหรับเจ้าของ
1. ทุกวันที่ 1 เวลา 08:00 ได้รับรายงาน PDF ของเดือนที่แล้วทางอีเมล
2. ได้สรุปตัวเลขสั้น ๆ ทาง LINE พร้อมกัน

### 🧪 การทดสอบอัตโนมัติ (สำหรับนักพัฒนา)
ต้องมี Node.js 20 ขึ้นไป

```bash
npm install
npx playwright install chromium   # ครั้งแรกครั้งเดียว
npm test                          # รันทั้งหมด
npm run test:workflows            # ตรวจไฟล์ workflow-*.json ของ n8n
npm run test:e2e                  # เปิด index.html / admin.html ด้วย Playwright
```

- `tests/workflows.test.js` ตรวจว่าไฟล์ workflow parse ได้, ทุก node มีฟิลด์ครบ, ชื่อไม่ซ้ำ, connections ชี้ไป node ที่มีจริง, มี trigger และไม่มี token ฝังในไฟล์
- `tests/e2e/` เปิดหน้าเว็บจริงในเบราว์เซอร์ (desktop + มือถือ) รวมถึงหน้าต่างแชทน้องใส โดยปลอม LINE LIFF และ n8n API จึงไม่ต้องเปิด n8n/ngrok
- GitHub Actions (`.github/workflows/tests.yml`) รันชุดนี้ทุกครั้งที่ push เข้า `main` และทุก Pull Request

---

## 13. Roadmap

### ✅ v2.0
- 8 workflows หลัก (Q, A, B, C, D, E, F, S) + AI summary + Re-booking
- LINE + Sheets + Gemini integration
- Frontend: index.html + admin.html

### ✅ v2.1 (ปัจจุบัน · พ.ย. 2026)
- 🤖 แชทบอท "น้องใส" (Workflow G) ตอบคำถามจากชีต ทั้งใน LINE และหน้าเว็บ · Workflow B ส่งต่อข้อความอิสระให้ G
- 📊 Dashboard real-time ใน admin.html (อัปเดตสดทุก 20 วินาที ไม่ต้องรีโหลด)
- 📄 รายงาน PDF รายเดือน (Workflow R + Gotenberg) ส่งอีเมล + LINE
- ⚙️ ย้ายค่าตั้งค่าหน้าเว็บไปไว้ที่ `config.js` ไฟล์เดียว
- 🧪 Automated tests + GitHub Actions CI
- 🖼️ รูปตัวอย่างห้องจาก Unsplash ในหน้าจอง

### 🔜 ถัดไป
- รองรับ Messenger / Telegram (ขยายช่องทาง)
- Voice-to-text สำหรับแม่บ้านรายงานสถานะห้อง
- Predictive pricing (AI แนะนำราคาตามฤดูกาล)

---

## 14. ค่าใช้จ่าย

| รายการ | ค่าใช้จ่าย | หมายเหตุ |
|---|---|---|
| n8n (self-hosted ใน Docker) | **0 บาท** | รันบนเครื่องตัวเอง ไม่จำกัด executions แต่เครื่องต้องเปิดไว้ตลอด |
| ngrok | **0 บาท** | Free plan ได้โดเมนคงที่ 1 โดเมน |
| Gotenberg (สร้าง PDF) | **0 บาท** | โอเพนซอร์ส รันใน Docker เครื่องเดียวกัน ไม่ต้องมี API key |
| Google Sheets | **0 บาท** | ฟรีด้วยบัญชี Google (จำกัด 10 ล้าน cells ต่อไฟล์) |
| LINE OA | **0 บาท** | แพ็กเกจฟรี: ส่ง push/broadcast ได้ 300 ข้อความ/เดือน · ข้อความตอบกลับ (Reply) ไม่นับโควตา |
| Gemini 3.5 Flash Lite | **0 บาท** | Free tier ของ Google AI Studio (ดูโควตาต่อนาที/ต่อวันได้ที่ AI Studio → Rate limits) |
| Gmail SMTP (ส่งรายงาน) | **0 บาท** | ใช้ Gmail + App Password |
| Hosting (GitHub Pages) | **0 บาท** | Free static hosting |
| GitHub Actions (CI) | **0 บาท** | ฟรีไม่จำกัดสำหรับ public repo (private repo มีนาทีฟรีทุกเดือน) |
| รูปตัวอย่าง (Unsplash) | **0 บาท** | Unsplash License ใช้ฟรี ดู [IMAGE_CREDITS.md](IMAGE_CREDITS.md) |
| **รวม** | **0 บาท/เดือน** | |

> ⚠️ LINE ประเทศไทยประกาศว่าตั้งแต่ **1 ก.พ. 2570 (2027)** Reply API จะฟรี 25,000 ข้อความแรกต่อเดือน และ OA ที่ใช้ Reply API ต้องลงทะเบียนผ่าน Agency Partner ที่ LINE กำหนด ([ประกาศ LINE for Business](https://lineforbusiness.com/th/news/20261030)) โรงแรมขนาดนี้ยังอยู่ในโควตาฟรี แต่ต้องทำขั้นตอนลงทะเบียนเมื่อถึงเวลา
>
> ข้อมูลราคาตรวจเมื่อ พ.ย. 2026 จาก [LINE for Business](https://lineforbusiness.com/th/service/line-oa-features/broadcast-message), [LINE Developers](https://developers.line.biz/en/docs/messaging-api/pricing/) และ [Gemini API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

### เทียบกับคู่แข่ง

| ทางเลือก | ราคา/เดือน | ฟีเจอร์ |
|---|---|---|
| **Hotel PMS Cloud** | 1,500 - 15,000 บาท | เต็มฟีเจอร์ แต่แพง |
| **LINE OA + Excel ด้วยคน** | ~5,000 บาท (ค่าแรง) | ถูก แต่ผิดพลาดได้ |
| **Sai Lan Hotel v2** | **0 บาท** | อัตโนมัติ + ใช้งานง่าย |

### Capacity (Free Tier)
- โรงแรม 1-50 ห้อง ✓
- ~60-80 booking/เดือน ✓ (จำกัดด้วยโควตา push LINE ฟรี 300 ข้อความ/เดือน: แขก 1 คนใช้ราว 3-4 push คือยืนยันจอง, welcome, ขอคะแนน, ดีลกลับ · ข้อความเข้ากลุ่มแม่บ้านนับตามจำนวนสมาชิกในกลุ่ม)
- คำถามแชทบอทไม่จำกัดโดย LINE (เป็น Reply ไม่นับโควตา) แต่จำกัดด้วยโควตาฟรีของ Gemini · ถ้าเต็ม แขกได้ข้อความสำรองพร้อมเบอร์โทร

---

## 15. License

โปรเจกต์นี้ทำเพื่อการศึกษาในรายวิชา ยังไม่มีไฟล์ LICENSE ใน repo (ถ้าต้องการเปิดให้ใช้ต่อแบบ MIT ให้เพิ่มไฟล์ `LICENSE`)

รูปตัวอย่างในหน้าเว็บเป็นของช่างภาพบน Unsplash ภายใต้ Unsplash License ดู [IMAGE_CREDITS.md](IMAGE_CREDITS.md)

---

## 🙏 Credits

สร้างโดยทีมพัฒนา **Sai Lan Hotel v2**

> *ถ้ามีคำถามหรืออยาก contribute: [issues](https://github.com/Nestyzxc/hotel-booking/issues)*

---

<div align="center">

**"พนักงานเสมือนที่ทำงาน 24 ชั่วโมง ในราคา 0 บาท"**

</div>
