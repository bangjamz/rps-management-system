# Entity Relationship Diagram (ERD)

**RPS Management System - Complete Database Relationships**  
**Last Updated:** 2026-02-04  
**Database:** PostgreSQL  
**ORM:** Sequelize

---

## 📊 Full ERD (Mermaid Diagram)

```mermaid
erDiagram
    %% ========== ORGANIZATIONAL ENTITIES ==========
    
    users ||--o{ mahasiswa : "has profile"
    users ||--o{ dosen : "has profile"
    users ||--o{ attendance : "marks"
    users ||--o{ student_grade : "grades"
    users ||--o{ final_grade : "approves"
    users ||--o{ rps : "reviews"
    users ||--o{ notifications : "receives"
    
    fakultas ||--o{ prodi : "contains"
    
    prodi ||--o{ mahasiswa : "enrolls"
    prodi ||--o{ dosen : "employs"
    prodi ||--o{ mata_kuliah : "offers"
    prodi ||--o{ cpl : "defines"
    prodi ||--o{ grading_system : "configures"
    
    %% ========== CURRICULUM HIERARCHY ==========
    
    cpl ||--o{ cpmk : "contains"
    cpmk ||--o{ sub_cpmk : "contains"
    
    %% ========== COURSE & RPS ==========
    
    mata_kuliah ||--o{ rps : "has plans"
    mata_kuliah ||--o{ enrollment : "has enrollments"
    mata_kuliah ||--o{ assessment_component : "has assessments"
    mata_kuliah ||--o{ student_grade : "records grades"
    mata_kuliah ||--o{ final_grade : "has final grades"
    
    dosen ||--o| rps : "teaches"
    
    rps ||--o{ rps_pertemuan : "schedules"
    rps ||--o{ penilaian_mk : "defines assessment"
    
    rps_pertemuan }o--|| sub_cpmk : "targets"
    rps_pertemuan ||--o{ attendance : "tracks presence"
    
    %% ========== GRADING SYSTEM ==========
    
    grading_system }o--|| grade_scale : "uses"
    grade_scale ||--o{ grade_scale_detail : "defines rules"
    
    assessment_component }o--|| sub_cpmk : "assesses"
    assessment_component ||--o{ student_grade : "has scores"
    
    mahasiswa ||--o{ student_grade : "receives grades"
    mahasiswa ||--o{ final_grade : "has final grades"
    mahasiswa ||--o{ attendance : "attends"
    mahasiswa ||--o{ enrollment : "registers"
    
    enrollment }o--|| mata_kuliah : "for course"
    enrollment }o--|| mahasiswa : "by student"
    
    %% ========== ENTITY DEFINITIONS ==========
    
    users {
        int id PK
        string name
        string email UK
        string password
        enum role
        timestamp created_at
        timestamp updated_at
    }
    
    fakultas {
        int id PK
        string kode_fakultas UK
        string nama_fakultas
        timestamp created_at
        timestamp updated_at
    }
    
    prodi {
        int id PK
        int fakultas_id FK
        string kode_prodi UK
        string nama_prodi
        enum jenjang
        timestamp created_at
        timestamp updated_at
    }
    
    mahasiswa {
        int id PK
        int user_id FK "UK"
        int prodi_id FK
        string npm UK
        string nama
        string email
        string angkatan
        timestamp created_at
        timestamp updated_at
    }
    
    dosen {
        int id PK
        int user_id FK "UK"
        int prodi_id FK
        string nidn UK
        string nama
        string email
        timestamp created_at
        timestamp updated_at
    }
    
    cpl {
        int id PK
        int prodi_id FK
        string kode
        text deskripsi
        enum kategori
        timestamp created_at
        timestamp updated_at
    }
    
    cpmk {
        int id PK
        int cpl_id FK
        string kode
        text deskripsi
        timestamp created_at
        timestamp updated_at
    }
    
    sub_cpmk {
        int id PK
        int cpmk_id FK
        string kode
        text deskripsi
        timestamp created_at
        timestamp updated_at
    }
    
    mata_kuliah {
        int id PK
        int prodi_id FK
        string kode_mk UK
        string nama_mk
        int sks
        int semester
        enum jenis
        timestamp created_at
        timestamp updated_at
    }
    
    rps {
        int id PK
        int mata_kuliah_id FK
        string semester
        string tahun_ajaran
        int dosen_pengampu_id FK
        text deskripsi_mk
        enum status
        timestamp submitted_at
        int reviewed_by FK
        timestamp reviewed_at
        text review_notes
        timestamp created_at
        timestamp updated_at
    }
    
    rps_pertemuan {
        int id PK
        int rps_id FK
        int pertemuan_ke
        date tanggal
        text topik
        int sub_cpmk_id FK
        text metode_pembelajaran
        text materi
        text bentuk_evaluasi
        timestamp created_at
        timestamp updated_at
    }
    
    penilaian_mk {
        int id PK
        int rps_id FK
        string komponen
        decimal bobot
        text kriteria
        timestamp created_at
        timestamp updated_at
    }
    
    grading_system {
        int id PK
        int prodi_id FK
        string semester
        string tahun_ajaran
        enum grading_mode
        int grade_scale_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    grade_scale {
        int id PK
        string scale_name UK
        text description
        timestamp created_at
        timestamp updated_at
    }
    
    grade_scale_detail {
        int id PK
        int grade_scale_id FK
        string nilai_huruf
        decimal nilai_angka_min
        decimal nilai_angka_max
        decimal nilai_ip
        timestamp created_at
        timestamp updated_at
    }
    
    assessment_component {
        int id PK
        int mata_kuliah_id FK
        string semester
        string tahun_ajaran
        enum component_type
        string legacy_name
        decimal legacy_weight
        int sub_cpmk_id FK
        string pertemuan_range
        decimal obe_weight
        timestamp created_at
        timestamp updated_at
    }
    
    student_grade {
        int id PK
        int mahasiswa_id FK
        int mata_kuliah_id FK
        int assessment_component_id FK
        decimal nilai_angka
        string nilai_huruf
        decimal nilai_ip
        int graded_by FK
        timestamp graded_at
        timestamp created_at
        timestamp updated_at
    }
    
    final_grade {
        int id PK
        int mahasiswa_id FK
        int mata_kuliah_id FK
        string semester
        string tahun_ajaran
        int grading_system_id FK
        decimal nilai_angka
        string nilai_huruf
        decimal nilai_ip
        enum status
        int approved_by FK
        timestamp approved_at
        timestamp created_at
        timestamp updated_at
    }
    
    attendance {
        int id PK
        int mahasiswa_id FK
        int rps_pertemuan_id FK
        enum status
        text notes
        int marked_by FK
        timestamp marked_at
        timestamp created_at
        timestamp updated_at
    }
    
    enrollment {
        int id PK
        int mahasiswa_id FK
        int mata_kuliah_id FK
        string semester
        string tahun_ajaran
        enum status
        timestamp enrolled_at
        timestamp dropped_at
        string final_grade
        decimal final_ip
        timestamp created_at
        timestamp updated_at
    }

    academic_years {
        int id PK
        string name UK
        bool is_active
        enum active_semester
        timestamp created_at
        timestamp updated_at
    }

    notifications {
        int id PK
        int user_id FK
        string title
        text message
        enum type
        bool is_read
        string link
        timestamp created_at
    }
```

---

## 🔗 Relationship Summary

### One-to-Many Relationships

| Parent | Child | Relationship | Cardinality |
|--------|-------|--------------|-------------|
| **Fakultas** | Prodi | contains | 1:N |
| **Prodi** | Mahasiswa | enrolls | 1:N |
| **Prodi** | Dosen | employs | 1:N |
| **Prodi** | Mata Kuliah | offers | 1:N |
| **Prodi** | CPL | defines | 1:N |
| **Prodi** | Grading System | configures | 1:N |
| **CPL** | CPMK | contains | 1:N |
| **CPMK** | Sub-CPMK | contains | 1:N |
| **Mata Kuliah** | RPS | has plans | 1:N |
| **Mata Kuliah** | Enrollment | has enrollments | 1:N |
| **Mata Kuliah** | Assessment Component | has assessments | 1:N |
| **RPS** | RPS Pertemuan | schedules | 1:N |
| **RPS** | Penilaian MK | defines assessment | 1:N |
| **RPS Pertemuan** | Attendance | tracks presence | 1:N |
| **Grade Scale** | Grade Scale Detail | defines rules | 1:N |
| **Assessment Component** | Student Grade | has scores | 1:N |
| **Mahasiswa** | Student Grade | receives grades | 1:N |
| **Mahasiswa** | Final Grade | has final grades | 1:N |
| **Mahasiswa** | Attendance | attends | 1:N |
| **Mahasiswa** | Enrollment | registers | 1:N |

### Many-to-One Relationships

| Child | Parent | Purpose |
|-------|--------|---------|
| **Mahasiswa** | User | authentication profile |
| **Dosen** | User | authentication profile |
| **RPS** | Dosen | lecturer assignment |
| **Grading System** | Grade Scale | grade conversion |
| **RPS Pertemuan** | Sub-CPMK | learning outcome target |
| **Assessment Component** | Sub-CPMK | OBE assessment |
| **Enrollment** | Mahasiswa | student registration |
| **Enrollment** | Mata Kuliah | course registration |

### Self-Referencing Relationships

| Table | Reference | Purpose |
|-------|-----------|---------|
| **RPS** | User (reviewed_by) | approval workflow |
| **Student Grade** | User (graded_by) | grading audit |
| **Final Grade** | User (approved_by) | approval workflow |
| **Attendance** | User (marked_by) | attendance audit |

---

## 📝 Cardinality Notation

```
||--o{ : One-to-Many (1:N)
}o--|| : Many-to-One (N:1)
||--|| : One-to-One (1:1)
}o--o{ : Many-to-Many (N:M)
```

**Participation:**
- `||` : Exactly one (mandatory)
- `|o` : Zero or one (optional)
- `}|` : One or more (mandatory)
- `}o` : Zero or more (optional)

---

## 🎯 Key Constraints

### Unique Constraints

| Table | Columns | Purpose |
|-------|---------|---------|
| users | email | Prevent duplicate accounts |
| fakultas | kode_fakultas | Unique faculty codes |
| prodi | kode_prodi | Unique program codes |
| mahasiswa | npm, user_id | Unique student IDs |
| dosen | nidn, user_id | Unique lecturer IDs |
| mata_kuliah | kode_mk | Unique course codes |
| rps | (mata_kuliah_id, semester, tahun_ajaran) | One RPS per course/semester/year |
| rps_pertemuan | (rps_id, pertemuan_ke) | Unique week numbers per RPS |
| student_grade | (mahasiswa_id, assessment_component_id) | One grade per component |
| final_grade | (mahasiswa_id, mata_kuliah_id, semester, tahun_ajaran) | One final grade per enrollment |
| attendance | (mahasiswa_id, rps_pertemuan_id) | One attendance record per meeting |
| enrollment | (mahasiswa_id, mata_kuliah_id, semester, tahun_ajaran) | Prevent duplicate enrollment |

### Foreign Key Constraints

**Total FK Constraints:** 45+

**With CASCADE DELETE:**
- CPL → CPMK → Sub-CPMK (curriculum hierarchy)
- RPS → RPS Pertemuan (meeting cascade)
- Grade Scale → Grade Scale Detail (conversion rules)

**With RESTRICT:**
- Prodi → Mahasiswa (prevent deletion with active students)
- Mata Kuliah → RPS (prevent deletion with existing plans)

---

## 🔄 Cascade Rules

### ON DELETE CASCADE
```sql
CPL → CPMK → Sub-CPMK       -- Delete curriculum hierarchy
RPS → RPS Pertemuan          -- Delete meeting schedule
RPS → Penilaian MK          -- Delete assessment components
Grade Scale → Details        -- Delete conversion rules
```

### ON DELETE RESTRICT
```sql
Prodi → Mahasiswa           -- Cannot delete prodi with students
Mata Kuliah → RPS           -- Cannot delete course with RPS
Mahasiswa → Enrollment      -- Cannot delete with active enrollment
```

### ON DELETE SET NULL
```sql
RPS → Dosen (dosen_pengampu_id)  -- Allow lecturer deletion
```

---

## 📈 Indexing Strategy

### Primary Indexes (auto-created)
- All `id` columns (PRIMARY KEY)

### Foreign Key Indexes
- All FK columns for join performance

### Composite Indexes
```sql
-- For enrollment queries
CREATE INDEX idx_enrollment_lookup 
ON enrollment(mahasiswa_id, mata_kuliah_id, semester, tahun_ajaran);

-- For grade queries
CREATE INDEX idx_grade_lookup 
ON student_grade(mahasiswa_id, mata_kuliah_id);

-- For attendance reports
CREATE INDEX idx_attendance_student 
ON attendance(mahasiswa_id, status);

-- For RPS filtering
CREATE INDEX idx_rps_filter 
ON rps(mata_kuliah_id, semester, tahun_ajaran, status);
```

---

## 🎨 Relationship Patterns

### Inheritance Pattern
```
User (parent)
  ├─ Mahasiswa (child via user_id)
  └─ Dosen (child via user_id)
```

### Composition Pattern
```
RPS (whole)
  ├─ RPS Pertemuan (part)
  └─ Penilaian MK (part)
```

### Aggregation Pattern
```
Prodi (container)
  ├─ CPL (component)
  ├─ Mahasiswa (component)
  └─ Mata Kuliah (component)
```

---

**Diagram Generated:** 2026-02-04  
**Total Entities:** 21  
**Total Relationships:** 45+  
**Normalization Level:** 3NF
