# 🏨 Sai Lan Hotel v2

**ระบบดูแลผู้เข้าพักอัตโนมัติเต็มวงจร (Automated Guest Journey)**

> *จอง → ยืนยัน LINE → เตรียมห้อง → ทักได้ตลอด 24 ชม. → ประเมิน → AI สรุปความชอบ → ดีลส่วนตัวดึงกลับมา*

---

## 📑 สารบัญ

1. [Concept & ที่มา](#1-concept--ที่มา)
2. [ปัญหาที่แก้](#2-ปัญหาที่แก้)
3. [เป้าหมาย](#3-เป้าหมาย)
4. [Solution ภาพรวม](#4-solution-ภาพรวม)
5. [Tech Stack](#5-tech-stack)
6. [สถาปัตยกรรม](#6-สถาปัตยกรรม)
7. [Workflows ทั้ง 8](#7-workflows-ทั้ง-8)
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
   จอง        เตรียมห้อง       ทัก LINE        ประเมิน       AI สรุป       ดีลกลับ
   (A)           (F)            (B)            (C)           (D)          (E)
       │            │             │              │             │            │
       ▼            ▼             ▼              ▼             ▼            ▼
   ─────────────────────────────────────────────────────────────────────────────
                          n8n (ตัวกลางทำงานอัตโนมัติ)
   ─────────────────────────────────────────────────────────────────────────────
       │            │             │              │             │            │
       ▼            ▼             ▼              ▼             ▼            ▼
   📊 Google Sheets (ฐานข้อมูลกลาง 8 ชีต — แก้ไขได้จาก Excel)
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
│  • index.html    → หน้าจอง + ดูห้อง                              │
│  • admin.html    → หลังบ้านพนักงาน (Staff Key)                  │
│  • ทั้งคู่ฝากบน GitHub Pages (free)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  n8n Cloud (free tier, 1 instance)                              │
│  ┌────────────┬────────────┬────────────┬────────────┐          │
│  │ Q: Hotel   │ A: Booking │ B: LINE    │ S: Staff   │ Webhook   │
│  │ API        │ v2         │ Router v2  │ API        │          │
│  ├────────────┼────────────┼────────────┼────────────┤          │
│  │ C: Rating  │ D: AI      │ E: Re-     │ F: Daily   │ Cron      │
│  │ 20:00      │ Summary    │ booking    │ Ops 09:00  │          │
│  └────────────┴────────────┴────────────┴────────────┘          │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Google       │ │ LINE Official│ │ Gemini AI    │
│ Sheets 1 file│ │ Account      │ │ 3.5 Flash   │
│ 8 ชีต        │ │ (Push+Reply) │ │ (Lite, free) │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 7. Workflows ทั้ง 8

| ID | Workflow | Trigger | Auth | ใครใช้ | หน้าที่ |
|---|---|---|---|---|---|
| **Q** | Hotel API | Webhook GET | none | แขก (เว็บ) | ตอบ {ห้องว่าง, ราคา, โปรโม} |
| **A** | Booking v2 | Webhook POST | LINE id_token | แขก (จอง) | ตรวจสอบ → จอง → Push LINE ยืนยัน + แจ้งแม่บ้าน |
| **B** | LINE Router v2 | Webhook POST | LINE signature | ทุกคน (LINE) | ตอบ LINE + อัปเดตสถานะห้อง + บันทึกทุกแชท |
| **C** | Rating | Cron 20:00 | - | - | ส่ง "⭐ ให้คะแนน" หลังเช็กอิน 1 คืน |
| **D** | AI Summary | Cron hourly | - | - | 💎 Gemini สรุป preference_tags |
| **E** | Re-booking | Cron 10:00 | - | - | ส่งข้อเสนอส่วนตัว (ใช้ tags จาก D) |
| **F** | Daily Ops | Cron 09:00 | - | - | Welcome แขก + Digest แม่บ้าน |
| **S** | Staff API | Webhook GET/POST | Staff Key | พนักงาน | เช็กอิน/เอาต์, แก้ห้อง, ส่ง push |

---

## 8. Flow การทำงาน

### ขั้นที่ 1: ก่อนจอง → Workflow Q

```
👤 เปิด index.html
   └─► JS เรียก GET /api/hotel
       └─► Q: อ่าน Sheets (Config, RoomTypes, Promos)
           └─► ตอบ JSON {ห้องว่าง, ราคา, โปรโม}
```

### ขั้นที่ 2: จองห้อง → Workflow A

```
👤 กรอกฟอร์ม + ยืนยัน LINE (LIFF → id_token)
   └─► POST /booking
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
```

---

## 9. การใช้ LLM (Gemini)

### 🎯 ทำไมต้องมี LLM?

> **"ระบบอัตโนมัติทั่วไปตอบได้แค่ FAQ — แต่เราต้องการให้ระบบ 'จำ' ว่าแขกชอบอะไร เพื่อเอาไปทำดีลกลับมาให้เหมือนคนดูแลเอง"**

### 📍 ตำแหน่งเดียวในระบบ — Workflow D

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
       ║ 💎 Gemini 3.5      ║  ← LLM จุดเดียว
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
| **Workflow ที่ใช้** | 1 (D - Preference Summary) |
| **Model** | `gemini-3.5-flash-lite` |
| **เรียกบ่อยแค่ไหน** | cron ทุก 1 ชม. × เฉพาะ booking ที่ Checked-out + ยังไม่มี tags |
| **Output ใช้ที่ไหน** | เก็บใน Sheets → Workflow E อ่านไปทำดีลส่วนตัว |
| **ค่าใช้จ่าย** | ~0 บาท (Free tier) |

---

## 10. ฐานข้อมูล Google Sheets

**1 ไฟล์ / 8 ชีต** เป็น Single Source of Truth

| # | ชีต | ใช้โดย | คำอธิบาย |
|---|---|---|---|
| 1 | **Config** | Q, A, S | ค่าตั้ง (รหัส WiFi, แผนที่, เวลาเช็กอิน/เอาต์, ส่วนลด) |
| 2 | **RoomTypes** | Q, A | ประเภทห้อง (Quiet, Sea View, Standard) + ราคา + สิ่งอำนวยความสะดวก |
| 3 | **Rooms** | A, B, S | ห้องแต่ละห้อง (101, 102, ... + hk_status: Dirty/Cleaning/Clean) |
| 4 | **Bookings** | A, B, C, D, E, F, S | การจอง (booking_id, customer, วันที่, ราคา, status, rating, tags) |
| 5 | **Customers** | A, D, E | ลูกค้า (line_user_id, full_name, lifetime_spent, last_preference_tags) |
| 6 | **Messages** | B, D | ทุกข้อความ LINE ที่เข้า-ออก |
| 7 | **Offers** | E | ดีลส่วนตัวที่ส่ง (status: pending/claimed/expired) |
| 8 | **ActivityLog** | A, B, F, S | Audit log ทุก action |

### หลักการ
- พนักงานเปิด Sheets แก้ไขได้ทันที
- Audit trail ครบใน ActivityLog
- ส่งออก CSV/Excel ได้ตรง ๆ
- Backup ในตัว (Google Drive history)

---

## 11. การติดตั้ง

### Prerequisites
- บัญชี n8n Cloud (free) หรือ self-hosted
- บัญชี Google Workspace + Sheets 1 ไฟล์
- LINE Official Account + Messaging API
- Gemini API Key (free tier)
- GitHub Pages (free) สำหรับ frontend

### Steps

```bash
# 1. Clone repo
git clone https://github.com/yourname/sai-lan-hotel-v2.git
cd sai-lan-hotel-v2

# 2. Import 8 workflows เข้า n8n
#    (File → Import from file)
#    - workflow-q-hotel-api.json
#    - workflow-a-booking-v2.json
#    - workflow-b-line-router-v2.json
#    - workflow-c-rating.json
#    - workflow-d-ai-summary.json
#    - workflow-e-rebooking.json
#    - workflow-f-daily-ops.json
#    - workflow-s-staff-api.json

# 3. ตั้งค่า Credentials ใน n8n
#    - Google Sheets OAuth2
#    - LINE Channel Access Token
#    - LINE Channel Secret
#    - Gemini API Key

# 4. สร้าง Google Sheets ตาม schema (ดู sheet-schema.md)

# 5. Deploy frontend ขึ้น GitHub Pages
#    - index.html (หน้าจอง)
#    - admin.html (หลังบ้าน)
```

### Environment Variables ที่ต้องตั้ง
```env
STAFF_KEY=<random-secret>
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
GEMINI_API_KEY=...
SHEET_ID=...
TIMEZONE=Asia/Bangkok
```

---

## 12. การใช้งาน

### 👤 สำหรับแขก
1. เปิด https://yourname.github.io/sai-lan-hotel-v2/
2. ดูห้องว่าง + ราคา
3. กรอกฟอร์ม + ยืนยัน LINE
4. ได้รับ Flex ยืนยันการจองทันที
5. ทัก LINE ได้ตลอด 24 ชม.
6. ให้คะแนน 1-5 ดาวหลังเช็กอิน 1 คืน
7. รอดีลส่วนตัวครั้งหน้า

### 👨‍💼 สำหรับพนักงาน
1. เปิด https://yourname.github.io/sai-lan-hotel-v2/admin.html
2. ใส่ Staff Key
3. ดู snapshot: ห้องว่าง, booking วันนี้, สถานะ housekeeping
4. กดปุ่มเช็กอิน/เอาต์
5. เปลี่ยนสถานะห้อง
6. ส่ง push ถึงแขก/แม่บ้าน

### 🛏️ สำหรับแม่บ้าน
1. รับแจ้งเตือนจาก LINE ทุกเช้า 09:00 (Digest)
2. ทำความสะอาด + กด "Cleaning Done" ใน LINE
3. ระบบอัปเดตสถานะห้องอัตโนมัติ

---

## 13. Roadmap

### ✅ v2.0 (ปัจจุบัน)
- 8 workflows ครบ + AI summary + Re-booking
- LINE + Sheets + Gemini integration
- Frontend: index.html + admin.html

### 🔜 v2.1 (Q4 2026)
- รองรับ Messenger / Telegram (ขยายช่องทาง)
- Dashboard real-time ใน admin.html
- ส่งออกรายงาน PDF รายเดือน

### 🔮 v3.0 (2027)
- เพิ่ม LLM จุดที่ 2: Auto-reply LINE (Gemini ตอบแชทแทนบอท FAQ)
- Voice-to-text สำหรับแม่บ้านรายงานสถานะห้อง
- Predictive pricing (AI แนะนำราคาตามฤดูกาล)

---

## 14. ค่าใช้จ่าย

| รายการ | ค่าใช้จ่าย | หมายเหตุ |
|---|---|---|
| n8n Cloud | **0 บาท** | Free tier 20 executions/วัน (พอใช้โรงแรมเล็ก) |
| Google Sheets | **0 บาท** | Free 1 ล้าน cells |
| LINE OA | **0 บาท** | Free messaging quota (500 push/เดือน) |
| Gemini 3.5 Flash Lite | **0 บาท** | Free tier 15 req/min |
| Hosting (GitHub Pages) | **0 บาท** | Free static hosting |
| **รวม** | **0 บาท/เดือน** | |

### เทียบกับคู่แข่ง

| ทางเลือก | ราคา/เดือน | ฟีเจอร์ |
|---|---|---|
| **Hotel PMS Cloud** | 1,500 - 15,000 บาท | เต็มฟีเจอร์ แต่แพง |
| **LINE OA + Excel ด้วยคน** | ~5,000 บาท (ค่าแรง) | ถูก แต่ผิดพลาดได้ |
| **Sai Lan Hotel v2** | **0 บาท** | อัตโนมัติ + ใช้งานง่าย |

### Capacity (Free Tier)
- โรงแรม 1-50 ห้อง ✓
- ~100 booking/เดือน ✓
- ~500 push LINE/เดือน ✓
- ~1,000 Gemini calls/เดือน ✓

---

## 15. License

MIT License - ใช้ฟรี คัดลอกฟรี แก้ไขฟรี

---

## 🙏 Credits

สร้างโดยทีมพัฒนา **Sai Lan Hotel v2**

> *ถ้ามีคำถามหรืออยาก contribute: [issues](https://github.com/yourname/sai-lan-hotel-v2/issues)*

---

<div align="center">

**"พนักงานเสมือนที่ทำงาน 24 ชั่วโมง ในราคา 0 บาท"**

⭐ Star this repo if it helps your hotel! ⭐

</div>
