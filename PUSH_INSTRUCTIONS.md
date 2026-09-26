# Push to GitHub

Repo URL: `https://github.com/Nestyzxc/hotel-booking`

## วิธีที่ 1 — Helper script (เร็วที่สุด)

```cmd
push-token.bat https://github.com/Nestyzxc/hotel-booking.git ghp_xxxxxxxxxxxxxxxx
```

แทน `ghp_xxx...` ด้วย Personal Access Token ที่มี scope `repo`

## วิธีที่ 2 — ผ่าน env var (token ไม่ขึ้น history)

```powershell
$env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxx"
git -C D:\hotel-n8n remote add origin https://github.com/Nestyzxc/hotel-booking.git
git -C D:\hotel-n8n push -u origin main
Remove-Item Env:\GITHUB_TOKEN
```

## วิธีที่ 3 — GitHub CLI

```cmd
winget install GitHub.cli
gh auth login --with-token
git -C D:\hotel-n8n remote add origin https://github.com/Nestyzxc/hotel-booking.git
git -C D:\hotel-n8n push -u origin main
```

## หลัง push เสร็จ

ตรวจสอบที่: https://github.com/Nestyzxc/hotel-booking

## สร้าง PAT (ถ้ายังไม่มี)

1. https://github.com/settings/tokens/new
2. Note: `hotel-n8n-deploy`
3. Expiration: 90 days
4. Scopes: `repo`
5. Generate token → copy (จะเห็นครั้งเดียว)
