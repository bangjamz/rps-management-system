# Attendance System Design

## Overview

Implement comprehensive attendance tracking system for course sessions (pertemuan) linked to RPS. Supports multiple marking methods and generates attendance reports with percentage calculations.

---

## Requirements

### Core Features
1. **Attendance Marking per Pertemuan**
   - Linked to RPSPertemuan (meeting schedule)
   - Multiple status types: Hadir, Izin, Sakit, Alpa
   - Manual marking by Dosen
   - Bulk marking support

2. **Attendance Reports**
   - Per student per course
   - Per course (class summary)
   - Attendance percentage calculation
   - Export to Excel/PDF

3. **Future Enhancements** (not in MVP)
   - QR Code attendance
   - Location-based check-in
   - Student self-attendance (with verification)

---

## Database Schema

### Attendance Table

```sql
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  mahasiswa_id INT REFERENCES mahasiswa(id),
  rps_pertemuan_id INT REFERENCES rps_pertemuan(id),
  status ENUM('Hadir', 'Izin', 'Sakit', 'Alpa'),
  marked_at TIMESTAMP,
  marked_by INT REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  UNIQUE(mahasiswa_id, rps_pertemuan_id)
);

CREATE INDEX idx_attendance_student ON attendance(mahasiswa_id);
CREATE INDEX idx_attendance_pertemuan ON attendance(rps_pertemuan_id);
CREATE INDEX idx_attendance_status ON attendance(status);
```

**Fields Explanation:**
- `status`: 
  - **Hadir** - Present
  - **Izin** - Excused absence (dengan izin)
  - **Sakit** - Sick leave
  - **Alpa** - Unexcused absence (tanpa keterangan)
- `marked_by`: Who marked attendance (Dosen user_id)
- `notes`: Optional reason for absence

---

## Backend API Design

### Endpoints

#### 1. Get Attendance for a Pertemuan

```
GET /api/attendance/pertemuan/:pertemuanId
```

**Response:**
```json
{
  "pertemuan": {
    "id": 1,
    "pertemuan_ke": 1,
    "topik": "Pengenalan Algoritma",
    "tanggal": "2025-09-01"
  },
  "attendance": [
    {
      "id": 1,
      "mahasiswa": {
        "id": 42,
        "npm": "2024123",
        "nama": "Agus Santoso"
      },
      "status": "Hadir",
      "marked_at": "2025-09-01T08:05:00Z",
      "notes": null
    }
  ],
  "summary": {
    "total": 30,
    "hadir": 28,
    "izin": 1,
    "sakit": 1,
    "alpa": 0,
    "unmarked": 0
  }
}
```

---

#### 2. Mark Attendance (Single)

```
POST /api/attendance/mark
```

**Request:**
```json
{
  "mahasiswa_id": 42,
  "rps_pertemuan_id": 1,
  "status": "Hadir",
  "notes": ""
}
```

**Response:**
```json
{
  "id": 1,
  "status": "Hadir",
  "marked_at": "2025-09-01T08:05:00Z"
}
```

---

#### 3. Bulk Mark Attendance

```
POST /api/attendance/bulk-mark
```

**Request:**
```json
{
  "rps_pertemuan_id": 1,
  "attendance": [
    { "mahasiswa_id": 42, "status": "Hadir" },
    { "mahasiswa_id": 43, "status": "Izin", "notes": "Sakit demam" },
    { "mahasiswa_id": 44, "status": "Alpa" }
  ]
}
```

---

#### 4. Get Attendance Report (Student)

```
GET /api/attendance/report/student/:mahasiswaId
  ?mataKuliahId=10
  &semester=Ganjil
  &tahunAjaran=2025/2026
```

**Response:**
```json
{
  "mahasiswa": {
    "id": 42,
    "npm": "2024123",
    "nama": "Agus Santoso"
  },
  "mataKuliah": {
    "id": 10,
    "kode_mk": "IF101",
    "nama_mk": "Algoritma Pemrograman"
  },
  "summary": {
    "total_pertemuan": 14,
    "hadir": 12,
    "izin": 1,
    "sakit": 1,
    "alpa": 0,
    "percentage": 85.71
  },
  "details": [
    {
      "pertemuan_ke": 1,
      "tanggal": "2025-09-01",
      "status": "Hadir"
    },
    {
      "pertemuan_ke": 2,
      "tanggal": "2025-09-08",
      "status": "Izin",
      "notes": "Sakit demam"
    }
  ]
}
```

---

#### 5. Get Attendance Report (Course)

```
GET /api/attendance/report/course/:courseId
  ?semester=Ganjil
  &tahunAjaran=2025/2026
```

**Response:**
```json
{
  "course": {...},
  "total_pertemuan": 14,
  "students": [
    {
      "mahasiswa_id": 42,
      "npm": "2024123",
      "nama": "Agus Santoso",
      "hadir": 12,
      "izin": 1,
      "sakit": 1,
      "alpa": 0,
      "percentage": 85.71
    }
  ],
  "class_average": 87.5
}
```

---

## Frontend UI Design

### 1. Attendance Marking Page (Dosen)

**Route:** `/dosen/courses/:courseId/attendance`

**Features:**
- List of pertemuan (meetings) from RPS
- Click pertemuan → open marking interface
- Student checklist with radio buttons (Hadir/Izin/Sakit/Alpa)
- Bulk actions: "Mark All Present", "Save All"
- Real-time save indicator

**UI Mockup:**
```
┌─────────────────────────────────────────────────┐
│ Attendance - Algoritma Pemrograman            │
│ Semester: Ganjil 2025/2026                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ Select Meeting: [Pertemuan 1 ▼]                │
│                                                 │
│ Date: 2025-09-01  │  Topic: Pengenalan Algoritma│
│                                                 │
│ [✓ Mark All Present]                   [Save]  │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ NPM      │ Nama          │ Status  │ Notes  │ │
│ ├─────────────────────────────────────────────┤ │
│ │ 2024123  │ Agus Santoso  │ ⦿ Hadir │        │ │
│ │          │               │ ○ Izin  │        │ │
│ │          │               │ ○ Sakit │        │ │
│ │          │               │ ○ Alpa  │        │ │
│ ├─────────────────────────────────────────────┤ │
│ │ 2024142  │ Bambang       │ ○ Hadir │ Sakit  │ │
│ │          │               │ ○ Izin  │ demam  │ │
│ │          │               │ ⦿ Sakit │        │ │
│ │          │               │ ○ Alpa  │        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Summary: 28 Hadir, 1 Izin, 1 Sakit, 0 Alpa    │
│ Completion: 30/30 (100%)                       │
└─────────────────────────────────────────────────┘
```

---

### 2. Attendance Report (Mahasiswa View)

**Route:** `/mahasiswa/attendance`

**Features:**
- List of enrolled courses
- Per-course attendance summary (percentage, total)
- Expandable details showing each pertemuan
- Color-coded status badges

**UI Mockup:**
```
┌────────────────────────────────────────┐
│ My Attendance - Semester Ganjil 2025   │
├────────────────────────────────────────┤
│                                        │
│ IF101 - Algoritma Pemrograman         │
│ ━━━━━━━━━━━━━━━━━━ 85.71%            │
│ 12 Hadir, 1 Izin, 1 Sakit, 0 Alpa     │
│ [View Details ▼]                       │
│                                        │
│ IF102 - Basis Data                     │
│ ━━━━━━━━━━━━━━━━━━ 92.86%            │
│ 13 Hadir, 0 Izin, 1 Sakit, 0 Alpa     │
│                                        │
└────────────────────────────────────────┘
```

---

### 3. Attendance Report (Dosen View)

**Route:** `/dosen/courses/:courseId/attendance-report`

**Features:**
- Class-wide attendance table
- Sortable by student, percentage
- Export to Excel
- Visual indicators (red for low attendance)

---

## Attendance Percentage Calculation

### Formula

```javascript
// Attendance percentage (only Hadir and Izin count as "present")
const attendancePercentage = ((hadir + izin) / totalPertemuan) * 100;

// OR strict calculation (only Hadir)
const strictPercentage = (hadir / totalPertemuan) * 100;
```

**Recommended:** Use first formula (Hadir + Izin) as "acceptable" attendance.

**Warning Thresholds:**
- < 75% → Red (at risk)
- 75-85% → Yellow (warning)
- > 85% → Green (good)

---

## Implementation Roadmap

### Phase 1: MVP (Core Functionality)
- [x] Design attendance system
- [ ] Database model (Attendance)
- [ ] Backend APIs:
  - [ ] Get attendance for pertemuan
  - [ ] Mark attendance (single + bulk)
  - [ ] Get student report
  - [ ] Get course report
- [ ] Frontend UI:
  - [ ] Attendance marking page (Dosen)
  - [ ] Student attendance view (Mahasiswa)
  - [ ] Course report (Dosen)

### Phase 2: Enhancements (Future)
- [ ] QR Code generation per pertemuan
- [ ] Student self-check-in with QR scan
- [ ] Location-based verification
- [ ] Email/WhatsApp attendance notifications
- [ ] Attendance analytics dashboard

---

## Integration Points

### With RPS System
- Attendance linked to `RPSPertemuan` (each meeting)
- Pertemuan count from RPS determines total meetings
- Attendance report can show topic/date from RPS

### With Grading System
- Attendance can be a "Soft Skill" component
- Use attendance percentage as grade input
- Example: Attendance 90% → 90 points for "Kehadiran" component

---

## Business Rules

1. **Marking Window:**
   - Dosen can mark attendance anytime (no time restriction in MVP)
   - Future: restrict to meeting day ± 1 day

2. **Status Priority:**
   - Hadir + Izin = "present" for percentage
   - Sakit counted as absence but excused
   - Alpa = unexcused, worst status

3. **Edit Policy:**
   - Dosen can edit attendance anytime
   - Audit trail (created_at, updated_at, marked_by)

4. **Minimum Attendance:**
   - Recommendation: 75% to be eligible for final exam
   - System displays warning if < 75%

---

## Next Steps

1. Create Attendance model
2. Implement backend APIs
3. Build Dosen attendance marking UI
4. Build Mahasiswa attendance view
5. Add attendance reports
6. (Optional) Excel export

---

**Estimated Effort:** ~4-6 hours for MVP

