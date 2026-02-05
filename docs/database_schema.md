# Database Schema Documentation

**RPS Management System - Complete Database Structure**  
**Last Updated:** 2026-02-04  
**Version:** Phase 6.1

---

## 📊 Entity Relationship Overview

### Core Organizational Structure
```
University
  └── Fakultas (Faculty)
        └── Prodi (Study Program)
              ├── Mahasiswa (Students)
              ├── Dosen (Lecturers)
              └── Mata Kuliah (Courses)
```

### Curriculum Hierarchy
```
Prodi
  └── CPL (Program Learning Outcomes)
        └── CPMK (Course Learning Outcomes)
              └── Sub-CPMK (Sub Learning Outcomes)
```

### Academic Operations
```
Mata Kuliah
  ├── RPS (Course Plan)
  │     └── RPS Pertemuan (Weekly Meetings)
  │           └── Attendance (per meeting)
  ├── Enrollment (Student Registration)
  ├── Assessment Components
  │     └── Student Grades
  │           └── Final Grades
  └── Penilaian MK (Course Assessment)
```

---

## 🗂️ Database Tables

### 1. Organizational & User Tables

#### `users`
Core system users with authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | User ID |
| name | VARCHAR(255) | NOT NULL | Full name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| password | VARCHAR(255) | NOT NULL | Hashed password (bcrypt) |
| role | ENUM | NOT NULL | Admin/Dekan/Kaprodi/Dosen/Mahasiswa |
| created_at | TIMESTAMP | | Registration timestamp |
| updated_at | TIMESTAMP | | Last update |

**Indexes:** `email`

---

#### `fakultas`
Faculty/school organizational unit.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Faculty ID |
| kode_fakultas | VARCHAR(10) | NOT NULL, UNIQUE | Faculty code (e.g., FT, FE) |
| nama_fakultas | VARCHAR(255) | NOT NULL | Faculty name |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

#### `prodi`
Study program (e.g., Teknik Informatika, Akuntansi).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Prodi ID |
| fakultas_id | INTEGER | FK → fakultas(id), NOT NULL | Parent faculty |
| kode_prodi | VARCHAR(10) | NOT NULL, UNIQUE | Prodi code |
| nama_prodi | VARCHAR(255) | NOT NULL | Prodi name |
| jenjang | ENUM | NOT NULL | D3/D4/S1/S2/S3 |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:** `fakultas_id`, `kode_prodi`

---

#### `mahasiswa`
Student records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Student ID |
| user_id | INTEGER | FK → users(id), UNIQUE | Linked user account |
| prodi_id | INTEGER | FK → prodi(id), NOT NULL | Student's program |
| npm | VARCHAR(20) | NOT NULL, UNIQUE | Student number (NPM) |
| nama | VARCHAR(255) | NOT NULL | Full name |
| email | VARCHAR(255) | NOT NULL | Email |
| angkatan | VARCHAR(10) | | Cohort year (e.g., 2024) |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:** `npm`, `prodi_id`, `user_id`

---

#### `dosen`
Lecturer records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Lecturer ID |
| user_id | INTEGER | FK → users(id), UNIQUE | Linked user account |
| prodi_id | INTEGER | FK → prodi(id) | Home program |
| nidn | VARCHAR(20) | NOT NULL, UNIQUE | National Lecturer ID |
| nama | VARCHAR(255) | NOT NULL | Full name |
| email | VARCHAR(255) | NOT NULL | Email |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:** `nidn`, `prodi_id`, `user_id`

---

### 2. Curriculum Tables

#### `cpl` (Capaian Pembelajaran Lulusan)
Program learning outcomes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | CPL ID |
| prodi_id | INTEGER | FK → prodi(id), NOT NULL | Owner program |
| kode | VARCHAR(20) | NOT NULL | CPL code (e.g., CPL-1) |
| deskripsi | TEXT | NOT NULL | Description |
| kategori | ENUM | | Sikap/Pengetahuan/Keterampilan Umum/Khusus |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Unique:** `(prodi_id, kode)`  
**Indexes:** `prodi_id`

---

#### `cpmk` (Capaian Pembelajaran Mata Kuliah)
Course learning outcomes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | CPMK ID |
| cpl_id | INTEGER | FK → cpl(id), NOT NULL | Parent CPL |
| kode | VARCHAR(20) | NOT NULL | CPMK code |
| deskripsi | TEXT | NOT NULL | Description |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:** `cpl_id`

---

#### `sub_cpmk`
Sub-course learning outcomes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Sub-CPMK ID |
| cpmk_id | INTEGER | FK → cpmk(id), NOT NULL | Parent CPMK |
| kode | VARCHAR(20) | NOT NULL | Sub-CPMK code |
| deskripsi | TEXT | NOT NULL | Description |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:** `cpmk_id`

---

### 3. Course & RPS Tables

#### `mata_kuliah`
Course catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Course ID |
| prodi_id | INTEGER | FK → prodi(id), NOT NULL | Owner program |
| kode_mk | VARCHAR(20) | NOT NULL, UNIQUE | Course code |
| nama_mk | VARCHAR(255) | NOT NULL | Course name |
| sks | INTEGER | NOT NULL | Credit hours |
| semester | INTEGER | | Recommended semester |
| jenis | ENUM | | Wajib/Pilihan |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:** `kode_mk`, `prodi_id`

---

#### `rps` (Rencana Pembelajaran Semester)
Course learning plan.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | RPS ID |
| mata_kuliah_id | INTEGER | FK → mata_kuliah(id), NOT NULL | Course |
| semester | VARCHAR(20) | NOT NULL | Ganjil/Genap |
| tahun_ajaran | VARCHAR(20) | NOT NULL | Academic year |
| dosen_pengampu_id | INTEGER | FK → dosen(id) | Main lecturer |
| deskripsi_mk | TEXT | | Course description |
| status | ENUM | DEFAULT 'Draft' | Draft/Submitted/Approved/Rejected |
| submitted_at | TIMESTAMP | | Submission time |
| reviewed_by | INTEGER | FK → users(id) | Reviewer (Kaprodi/Dekan) |
| reviewed_at | TIMESTAMP | | Review time |
| review_notes | TEXT | | Rejection reason |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Unique:** `(mata_kuliah_id, semester, tahun_ajaran)`  
**Indexes:** `mata_kuliah_id`, `status`

---

#### `rps_pertemuan`
Weekly meeting plans in RPS. *(Updated 2026-02-04 with additional OBE fields)*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Meeting ID |
| rps_id | INTEGER | FK → rps(id), NOT NULL | Parent RPS |
| minggu_ke | INTEGER | NOT NULL | Week number (1-15+) |
| tanggal | DATE | | Scheduled date |
| cpmk_id | INTEGER | FK → cpmk(id) | Target CPMK |
| sub_cpmk_id | INTEGER | FK → sub_cpmk(id) | Target Sub-CPMK |
| indikator | TEXT | | Indikator Ketercapaian |
| teknik_penilaian | JSON | | Array of assessment techniques |
| kriteria_penilaian | TEXT | | Kriteria Penilaian |
| materi | TEXT | | Materials/topics |
| metode_pembelajaran | JSON | | Array of teaching methods (max 3) |
| bentuk_pembelajaran | JSON | | Array: ['luring', 'daring'] |
| link_daring | TEXT | | Online session link (if daring) |
| bobot_penilaian | DECIMAL(5,2) | | Weight % for this meeting |
| topik | TEXT | | Topic/title (deprecated, use materi) |
| bentuk_evaluasi | TEXT | | Assessment form (deprecated) |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Unique:** `(rps_id, minggu_ke)`  
**Indexes:** `rps_id`, `sub_cpmk_id`, `cpmk_id`

---

#### `penilaian_mk`
Course assessment components in RPS.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Assessment ID |
| rps_id | INTEGER | FK → rps(id), NOT NULL | Parent RPS |
| komponen | VARCHAR(100) | NOT NULL | Component name (UTS, UAS, etc.) |
| bobot | DECIMAL(5,2) | NOT NULL | Weight percentage |
| kriteria | TEXT | | Criteria |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:** `rps_id`

---

### 4. Grading System Tables

#### `grading_system`
Grading mode configuration per prodi/semester.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Config ID |
| prodi_id | INTEGER | FK → prodi(id), NOT NULL | Target program |
| semester | VARCHAR(20) | NOT NULL | Ganjil/Genap |
| tahun_ajaran | VARCHAR(20) | NOT NULL | Academic year |
| grading_mode | ENUM | NOT NULL | legacy/obe |
| grade_scale_id | INTEGER | FK → grade_scale(id), NOT NULL | Active scale |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Unique:** `(prodi_id, semester, tahun_ajaran)`  
**Indexes:** `prodi_id`, `grade_scale_id`

---

#### `grade_scale`
Grade conversion scale definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Scale ID |
| scale_name | VARCHAR(100) | NOT NULL, UNIQUE | Name (e.g., "Legacy", "OBE") |
| description | TEXT | | Description |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

#### `grade_scale_detail`
Individual grade conversion rules.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Detail ID |
| grade_scale_id | INTEGER | FK → grade_scale(id), NOT NULL | Parent scale |
| nilai_huruf | VARCHAR(5) | NOT NULL | Letter grade (A, B+, etc.) |
| nilai_angka_min | DECIMAL(5,2) | NOT NULL | Min score (0-100) |
| nilai_angka_max | DECIMAL(5,2) | NOT NULL | Max score |
| nilai_ip | DECIMAL(3,2) | NOT NULL | Grade point (0-4.0) |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:** `grade_scale_id`

---

#### `assessment_component`
Assessment components for a course (UTS, UAS, Sub-CPMK, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Component ID |
| mata_kuliah_id | INTEGER | FK → mata_kuliah(id), NOT NULL | Course |
| semester | VARCHAR(20) | NOT NULL | Ganjil/Genap |
| tahun_ajaran | VARCHAR(20) | NOT NULL | Academic year |
| component_type | ENUM | NOT NULL | legacy/obe |
| **Legacy fields:** | | | |
| legacy_name | VARCHAR(100) | | UTS/UAS/Praktikum/Tugas/Soft Skill |
| legacy_weight | DECIMAL(5,2) | | Weight % |
| **OBE fields:** | | | |
| sub_cpmk_id | INTEGER | FK → sub_cpmk(id) | Target Sub-CPMK |
| pertemuan_range | VARCHAR(50) | | e.g., "1-2", "1-3" |
| obe_weight | DECIMAL(5,2) | | Weight % |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Indexes:** `mata_kuliah_id`, `sub_cpmk_id`

---

#### `student_grade`
Individual component scores.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Grade ID |
| mahasiswa_id | INTEGER | FK → mahasiswa(id), NOT NULL | Student |
| mata_kuliah_id | INTEGER | FK → mata_kuliah(id), NOT NULL | Course |
| assessment_component_id | INTEGER | FK → assessment_component(id), NOT NULL | Component |
| nilai_angka | DECIMAL(5,2) | NOT NULL | Score (0-100) |
| nilai_huruf | VARCHAR(5) | | Auto-calculated letter |
| nilai_ip | DECIMAL(3,2) | | Auto-calculated IP |
| graded_by | INTEGER | FK → users(id) | Grader (Dosen) |
| graded_at | TIMESTAMP | | Grading time |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Unique:** `(mahasiswa_id, assessment_component_id)`  
**Indexes:** `mahasiswa_id`, `mata_kuliah_id`, `assessment_component_id`

---

#### `final_grade`
Aggregated final course grades.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Final grade ID |
| mahasiswa_id | INTEGER | FK → mahasiswa(id), NOT NULL | Student |
| mata_kuliah_id | INTEGER | FK → mata_kuliah(id), NOT NULL | Course |
| semester | VARCHAR(20) | NOT NULL | Ganjil/Genap |
| tahun_ajaran | VARCHAR(20) | NOT NULL | Academic year |
| grading_system_id | INTEGER | FK → grading_system(id) | Used grading config |
| nilai_angka | DECIMAL(5,2) | NOT NULL | Weighted average |
| nilai_huruf | VARCHAR(5) | NOT NULL | Final letter grade |
| nilai_ip | DECIMAL(3,2) | NOT NULL | Final IP |
| status | ENUM | DEFAULT 'Draft' | Draft/Approved |
| approved_by | INTEGER | FK → users(id) | Approver |
| approved_at | TIMESTAMP | | Approval time |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Unique:** `(mahasiswa_id, mata_kuliah_id, semester, tahun_ajaran)`  
**Indexes:** `mahasiswa_id`, `mata_kuliah_id`

---

### 5. Attendance Table

#### `attendance`
Student attendance per RPS meeting.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Attendance ID |
| mahasiswa_id | INTEGER | FK → mahasiswa(id), NOT NULL | Student |
| rps_pertemuan_id | INTEGER | FK → rps_pertemuan(id), NOT NULL | Meeting |
| status | ENUM | NOT NULL | Hadir/Izin/Sakit/Alpa |
| notes | TEXT | | Notes (reason for absence) |
| marked_by | INTEGER | FK → users(id) | Marker (Dosen) |
| marked_at | TIMESTAMP | | Marking time |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Unique:** `(mahasiswa_id, rps_pertemuan_id)`  
**Indexes:** `mahasiswa_id`, `rps_pertemuan_id`

---

### 6. Enrollment Table

#### `enrollment`
Student course enrollment/registration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | Enrollment ID |
| mahasiswa_id | INTEGER | FK → mahasiswa(id), NOT NULL | Student |
| mata_kuliah_id | INTEGER | FK → mata_kuliah(id), NOT NULL | Course |
| semester | VARCHAR(20) | NOT NULL | Ganjil/Genap |
| tahun_ajaran | VARCHAR(20) | NOT NULL | Academic year |
| status | ENUM | NOT NULL, DEFAULT 'Active' | Active/Dropped/Completed |
| enrolled_at | TIMESTAMP | NOT NULL | Enrollment time |
| dropped_at | TIMESTAMP | | Drop time |
| final_grade | VARCHAR(5) | | Final letter grade (linked) |
| final_ip | DECIMAL(3,2) | | Final IP (linked) |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**Unique:** `(mahasiswa_id, mata_kuliah_id, semester, tahun_ajaran)`  
**Indexes:** `mahasiswa_id`, `mata_kuliah_id`, `status`

---


### 7. System Configuration & Utilities

#### `academic_years`
Academic year configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | ID |
| name | VARCHAR(20) | NOT NULL, UNIQUE | Name (e.g., 2025/2026) |
| is_active | BOOLEAN | DEFAULT false | Active flag |
| active_semester | ENUM | | Ganjil/Genap |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

---

#### `notifications`
User notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO_INCREMENT | ID |
| user_id | INTEGER | FK → users(id), NOT NULL | Recipient |
| title | VARCHAR(255) | NOT NULL | Title |
| message | TEXT | NOT NULL | Body |
| type | ENUM | DEFAULT 'info' | info/warning/success/error |
| is_read | BOOLEAN | DEFAULT false | Read status |
| link | VARCHAR(255) | | Action link |
| created_at | TIMESTAMP | | |

**Indexes:** `user_id`, `is_read`

---

## 🔗 Key Relationships

### Many-to-Many Relationships
1. **Dosen ↔ Mata Kuliah** (via `dosen_assignment`)
   - Cross-faculty teaching support
   
2. **CPL ↔ Mata Kuliah** (via `cpl_mk`)
   - Multiple CPLs per course

### One-to-Many Hierarchies
1. **Fakultas → Prodi → (Mahasiswa, Dosen, Mata Kuliah)**
2. **CPL → CPMK → Sub-CPMK**
3. **Mata Kuliah → RPS → RPS Pertemuan → Attendance**
4. **Mata Kuliah → Assessment Component → Student Grade → Final Grade**

### Complex Flows
1. **Grading Flow:**
   ```
   Assessment Component → Student Grade (per component)
                              ↓ (weighted average)
                         Final Grade (approved)
                              ↓
                         Enrollment (transcript)
   ```

2. **Attendance Flow:**
   ```
   RPS → RPS Pertemuan → Attendance Records
                              ↓ (calculation)
                         Attendance % per student
   ```

---

## 📈 Database Statistics

**Total Tables:** 21

**Table Categories:**
- Organizational: 5 (users, fakultas, prodi, mahasiswa, dosen)
- Curriculum: 3 (cpl, cpmk, sub_cpmk)
- Academic: 4 (mata_kuliah, rps, rps_pertemuan, penilaian_mk)
- Grading: 6 (grading_system, grade_scale, grade_scale_detail, assessment_component, student_grade, final_grade)
- Operations: 5 (attendance, enrollment, dosen_assignment, cpl_mk, notifications, academic_years)

**Total Foreign Keys:** 45+

**Unique Constraints:** 12+

---

## 🎯 Design Principles

1. **Normalization:** 3NF to avoid redundancy
2. **Soft Deletes:** Use status flags instead of DELETE
3. **Audit Trail:** created_at, updated_at, *_by fields
4. **Flexibility:** Support both Legacy and OBE grading
5. **Scalability:** Indexed FKs for performance
6. **Data Integrity:** Unique constraints on business keys

---

## 🔐 Security Considerations

- Passwords hashed with bcrypt (cost 10)
- RBAC implemented at application layer
- Sensitive grade data requires approval workflow
- Audit fields track who/when for accountability

---

**Generated:** 2026-02-04  
**Schema Version:** 6.1 (with Enrollment)
