# Grading System Design - OBE & Legacy Support

## Problem Statement

Institut Mahardika needs a grading system that:
1. **Supports OBE (Outcome-Based Education)** - Assessment per CPL → CPMK → Sub-CPMK
2. **Backward compatible with legacy system** - UTS, UAS, Praktikum, Tugas, Soft Skill
3. **Flexible grading scales** - Old (A=81-100, IP=4.0) vs New (A=86-90, IP=3.75)
4. **Sub-CPMK flexibility** - Can be assessed across multiple pertemuan

---

## Visual Reference

![Example OBE Grading Table](file:///Users/bangjamz/.gemini/antigravity/brain/62a38d41-ceb1-464b-885c-c6addb1b6f81/uploaded_media_0_1770169223942.jpg)

![Grading Scale Conversion](file:///Users/bangjamz/.gemini/antigravity/brain/62a38d41-ceb1-464b-885c-c6addb1b6f81/uploaded_media_1_1770169223942.png)

---

## Solution Architecture

### Strategy: **Dual-Mode Grading System**

Support both systems side-by-side with toggle per prodi/tahun ajaran:
- **Legacy Mode** (Traditional): UTS, UAS, Praktikum, Tugas, Soft Skill
- **OBE Mode** (Modern): CPL → CPMK → Sub-CPMK based

---

## Database Schema

### 1. GradingSystem (Configuration)

Defines which grading system is active per prodi/tahun ajaran.

```sql
CREATE TABLE grading_systems (
  id SERIAL PRIMARY KEY,
  prodi_id INT REFERENCES prodi(id),
  tahun_ajaran VARCHAR(10),
  system_type ENUM('legacy', 'obe'), -- Toggle
  grade_scale_id INT REFERENCES grade_scales(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example:**
- Prodi Informatika, 2024/2025 → `obe` system
- Prodi Keperawatan, 2024/2025 → `legacy` system (transisi bertahap)

---

### 2. GradeScale (Conversion Table)

Stores grading conversion (Huruf → Angka → IP)

```sql
CREATE TABLE grade_scales (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50), -- "Legacy Scale" or "OBE Scale"
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE grade_scale_details (
  id SERIAL PRIMARY KEY,
  grade_scale_id INT REFERENCES grade_scales(id),
  huruf VARCHAR(2), -- "A", "A-", "B+", etc.
  min_angka DECIMAL(5,2),
  max_angka DECIMAL(5,2),
  ip DECIMAL(3,2),
  sort_order INT
);
```

**Seeding Data:**

**Legacy Scale:**
```
A   | 81-100 | 4.0
B   | 69-80  | 3.0
C   | 50-68  | 2.0
D   | 41-49  | 1.0
E   | 0-40   | 0.0
```

**OBE Scale:**
```
A   | 86-90  | 3.75
A-  | 80-85  | 3.5
B+  | 76-79  | 3.25
B   | 73-75  | 3.0
B-  | 66-72  | 2.75
C+  | 61-65  | 2.5
C   | 51-60  | 2.0
D   | 41-50  | 1.0
E   | 0-40   | 0.0
```

---

### 3. AssessmentComponent (Flexible Components)

Defines what will be graded (legacy OR OBE).

```sql
CREATE TABLE assessment_components (
  id SERIAL PRIMARY KEY,
  mata_kuliah_id INT REFERENCES mata_kuliah(id),
  semester VARCHAR(10),
  tahun_ajaran VARCHAR(10),
  
  -- Component type
  component_type ENUM('legacy', 'obe'),
  
  -- For LEGACY mode
  legacy_type ENUM('UTS', 'UAS', 'Praktikum', 'Tugas', 'Soft Skill'),
  legacy_weight DECIMAL(5,2), -- Bobot dalam %
  
  -- For OBE mode
  sub_cpmk_id INT REFERENCES sub_cpmk(id),
  pertemuan_range VARCHAR(20), -- "1-2", "1-3", "5", etc.
  obe_weight DECIMAL(5,2), -- Bobot dalam %
  
  created_at TIMESTAMP
);
```

**Example Legacy:**
```json
{
  "component_type": "legacy",
  "legacy_type": "UTS",
  "legacy_weight": 30
}
```

**Example OBE:**
```json
{
  "component_type": "obe",
  "sub_cpmk_id": 5,
  "pertemuan_range": "1-3",
  "obe_weight": 15
}
```

---

### 4. StudentGrade (Individual Scores)

Stores actual student scores per component.

```sql
CREATE TABLE student_grades (
  id SERIAL PRIMARY KEY,
  mahasiswa_id INT REFERENCES mahasiswa(id),
  mata_kuliah_id INT REFERENCES mata_kuliah(id),
  assessment_component_id INT REFERENCES assessment_components(id),
  
  -- Score
  nilai_angka DECIMAL(5,2), -- 0-100
  
  -- Final calculated (auto-filled)
  nilai_huruf VARCHAR(2),
  nilai_ip DECIMAL(3,2),
  
  -- Metadata
  graded_by INT REFERENCES users(id),
  graded_at TIMESTAMP,
  notes TEXT
);
```

---

### 5. FinalGrade (Aggregated Result)

```sql
CREATE TABLE final_grades (
  id SERIAL PRIMARY KEY,
  mahasiswa_id INT REFERENCES mahasiswa(id),
  mata_kuliah_id INT REFERENCES mata_kuliah(id),
  semester VARCHAR(10),
  tahun_ajaran VARCHAR(10),
  
  -- Final scores
  total_angka DECIMAL(5,2), -- Weighted average
  nilai_huruf VARCHAR(2),
  nilai_ip DECIMAL(3,2),
  
  -- System used
  grading_system_id INT REFERENCES grading_systems(id),
  
  approved_by INT REFERENCES users(id),
  approved_at TIMESTAMP
);
```

---

## Backend API Design

### Endpoints

#### 1. Grading System Configuration

```
GET  /api/grading/config/:prodiId/:tahunAjaran
POST /api/grading/config
PUT  /api/grading/config/:id
```

**Response:**
```json
{
  "prodi_id": 1,
  "tahun_ajaran": "2025/2026",
  "system_type": "obe",
  "grade_scale": {
    "name": "OBE Scale",
    "details": [
      { "huruf": "A", "min": 86, "max": 90, "ip": 3.75 },
      { "huruf": "A-", "min": 80, "max": 85, "ip": 3.5 }
    ]
  }
}
```

---

#### 2. Assessment Components Management

```
GET    /api/assessment-components?mataKuliahId=X
POST   /api/assessment-components
PUT    /api/assessment-components/:id
DELETE /api/assessment-components/:id
```

**POST body (Legacy):**
```json
{
  "mata_kuliah_id": 10,
  "semester": "Ganjil",
  "tahun_ajaran": "2025/2026",
  "component_type": "legacy",
  "legacy_type": "UTS",
  "legacy_weight": 30
}
```

**POST body (OBE):**
```json
{
  "mata_kuliah_id": 10,
  "component_type": "obe",
  "sub_cpmk_id": 15,
  "pertemuan_range": "1-3",
  "obe_weight": 15
}
```

---

#### 3. Student Grading (Input Nilai)

```
GET  /api/grades/students?mataKuliahId=X&componentId=Y
POST /api/grades/students
PUT  /api/grades/students/:id
```

**POST body:**
```json
{
  "mahasiswa_id": 42,
  "mata_kuliah_id": 10,
  "assessment_component_id": 5,
  "nilai_angka": 85.5
}
```

**Auto-calculation:**
- System gets grade_scale from grading_system
- Converts `nilai_angka` to `nilai_huruf` and `nilai_ip`

---

#### 4. Final Grade Calculation

```
POST /api/grades/calculate-final
GET  /api/grades/final/:mahasiswaId/:mataKuliahId
```

**Calculation Logic:**
1. Get all `student_grades` for mahasiswa + mata kuliah
2. Calculate weighted average based on component weights
3. Convert to huruf/IP using active grade_scale
4. Store in `final_grades` table

---

## Frontend UI Design

### 1. Grading System Configuration (Kaprodi)

**Page:** `/kaprodi/grading/config`

**Features:**
- Toggle: Legacy vs OBE
- Select grade scale
- Preview grade conversion table

---

### 2. Assessment Setup (Dosen)

**Page:** `/dosen/courses/:id/assessment-setup`

**Legacy Mode UI:**
```
┌─────────────────────────────────────┐
│ Assessment Components (Legacy)      │
├─────────────────────────────────────┤
│ ☑ UTS              [30%]   [Edit]   │
│ ☑ UAS              [35%]   [Edit]   │
│ ☑ Praktikum        [20%]   [Edit]   │
│ ☑ Tugas            [10%]   [Edit]   │
│ ☑ Soft Skill       [5%]    [Edit]   │
│                                     │
│ Total: 100% ✓                       │
└─────────────────────────────────────┘
```

**OBE Mode UI:**
```
┌──────────────────────────────────────────────┐
│ Assessment Components (OBE)                  │
├──────────────────────────────────────────────┤
│ CPL-2 → CPMK-2                              │
│   Sub-CPMK 1 (P1-2)    [15%]  [Edit]       │
│   Sub-CPMK 2 (P3-5)    [15%]  [Edit]       │
│                                              │
│ CPL-4 → CPMK-4                              │
│   Sub-CPMK 1 (P1)      [15%]  [Edit]       │
│   Sub-CPMK 2 (P6-8)    [15%]  [Edit]       │
│                                              │
│ ... (continues)                              │
│                                              │
│ Total: 100% ✓                                │
└──────────────────────────────────────────────┘
```

---

### 3. Input Nilai (Dosen)

**Page:** `/dosen/courses/:id/grades`

**UI: Spreadsheet-like Table**

**Legacy Mode:**
| NPM | Nama | UTS (30%) | UAS (35%) | Praktikum (20%) | Tugas (10%) | Soft Skill (5%) | **Total** | **Huruf** | **IP** |
|-----|------|-----------|-----------|-----------------|-------------|-----------------|-----------|-----------|--------|
| 2024123 | Agus | 85 | 78 | 90 | 80 | 85 | **82.5** | **A** | **4.0** |
| 2024142 | Bambang | 70 | 75 | 80 | 70 | 75 | **74.0** | **B** | **3.0** |

**OBE Mode (matches uploaded image):**
| NPM | Nama | CPL-2 CPMK-2 | CPL-4 CPMK-4 | CPL-8 CPMK-8 | **Total** | **Huruf** | **IP** |
|-----|------|--------------|--------------|--------------|-----------|-----------|--------|
| ... | ... | Sub1 Sub2 | Sub1 Sub2 | Sub1 Sub2 | ... | ... | ... |

**Features:**
- Inline editing
- Auto-save on blur
- Color-coded (red for failing, green for excellent)
- Export to Excel
- Batch import from Excel

---

### 4. Grade Report (Mahasiswa View)

**Page:** `/mahasiswa/grades`

```
┌────────────────────────────────────────┐
│ Mata Kuliah: Algoritma Pemrograman    │
│ Dosen: Dr. Budi Santoso               │
│ Semester: Ganjil 2025/2026            │
├────────────────────────────────────────┤
│ Assessment Breakdown:                  │
│                                        │
│ CPL-2 → CPMK-2:                       │
│   ├─ Sub-CPMK 1 (P1-2): 85/100 (15%) │
│   └─ Sub-CPMK 2 (P3-5): 78/100 (15%) │
│                                        │
│ CPL-4 → CPMK-4:                       │
│   ├─ Sub-CPMK 1 (P1): 90/100 (15%)   │
│   └─ Sub-CPMK 2 (P6-8): 82/100 (15%) │
│                                        │
│ ... (continues)                        │
│                                        │
│ ────────────────────────────────────  │
│ FINAL GRADE: 82.5 → B+ → IP 3.25     │
└────────────────────────────────────────┘
```

---

## Migration Strategy (Legacy → OBE)

### Phase 1: Parallel Systems (Current)
- Both legacy and OBE available
- Prodi choose per tahun ajaran
- Old data preserved in legacy format

### Phase 2: Gradual Migration
- Import legacy grades as "aggregate" components
- Map to approximate CPL/CPMK (best effort)
- New semesters use OBE only

### Phase 3: Full OBE (Future)
- All new assessment use OBE
- Legacy data view-only (historical)
- Archive migration complete

---

## Implementation Priority

### Sprint 1: Foundation (1-2 weeks)
- [x] Database schema
- [ ] Grading system config API
- [ ] Grade scale management
- [ ] Basic assessment component CRUD

### Sprint 2: Legacy Grading (1 week)
- [ ] Legacy assessment setup UI
- [ ] Student grade input (spreadsheet UI)
- [ ] Auto-calculation & conversion
- [ ] Grade report for students

### Sprint 3: OBE Grading (1-2 weeks)
- [ ] OBE assessment setup UI
- [ ] Link Sub-CPMK to pertemuan
- [ ] OBE grade input (complex table)
- [ ] CPL attainment calculation

### Sprint 4: Reports & Export (1 week)
- [ ] PDF grade reports
- [ ] Excel import/export
- [ ] Grade analytics dashboard
- [ ] CPL achievement visualization

---

## Key Design Decisions

### 1. Why Dual-Mode?
**Reason:** Gradual adoption. Not all prodi ready for OBE simultaneously.

### 2. Why Flexible pertemuan_range?
**Reason:** Dosen have different teaching styles. Some assess Sub-CPMK in 1 pertemuan, some across 3.

### 3. Why Separate GradeScale?
**Reason:** Future-proof. Scale might change again. Easy to add new scales without code changes.

### 4. Why Auto-calculate?
**Reason:** Consistency. Prevent human error in conversion. Transparent for students.

---

## Technical Notes

**Frontend:**
- Use **react-data-grid** or **ag-grid** for spreadsheet UI
- Inline editing with validation
- Debounced auto-save

**Backend:**
- Transaction-based grade calculation
- Audit trail for grade changes
- Permission: Only assigned dosen can grade

**Database:**
- Index on (mahasiswa_id, mata_kuliah_id, tahun_ajaran)
- Archive old semesters to separate table

---

## Success Metrics

- ✅ Dosen can input grades in <5 minutes per class
- ✅ Auto-calculation 100% accurate
- ✅ Mahasiswa can view breakdown immediately
- ✅ Support 50+ components per course (OBE heavy)
- ✅ Export to Excel in <2 seconds

---

**Next Steps:**
1. Review & approve this design
2. Create database migration scripts
3. Build backend APIs
4. Implement UI (legacy first, then OBE)
