# RPS System Enhancement - Multi-Level Organizational Hierarchy & RBAC

## Phase 1: Planning & Analysis
- [x] Analyze current database schema and models
- [x] Review current authentication and authorization
- [x] Review current UI structure and "Coming soon" features
- [x] Design new organizational hierarchy (Institut → Fakultas → Prodi)
- [x] Design RBAC system with roles and permissions
- [x] Create implementation plan

## Phase 2: Database Schema & Models
- [x] Create Institusi, Fakultas, Prodi models
- [x] Update User/Dosen model with fakultas/prodi relations
- [x] Create CPL hierarchy (Institusi, Fakultas, Prodi)
- [x] Create role-based models (Admin Institusi, Dekan, Kaprodi)
- [x] Create lecturer assignment models
- [x] Create database migration/seed scripts

## Phase 3: Backend API Development
- [x] Implement organizational hierarchy endpoints
- [x] Implement RBAC middleware and permissions
- [x] Implement CPL management endpoints (multi-level)
- [x] Implement lecturer assignment endpoints
- [x] Implement cross-faculty lecturer selection
- [x] Update existing endpoints with new authorization
- [x] Setup GitHub repository and initial push

## Phase 4: Frontend - Admin & Setup
- [/] Create organizational structure management UI
- [/] Create user role management interface
- [/] Create CPL management (Institut/Fakultas/Prodi levels)
- [x] Create lecturer assignment interface for Kaprodi
- [x] Update auth store with org context
- [x] Update dashboards with real API stats

## Phase 5: Frontend - Kaprodi Features
- [x] Replace "Coming soon" with real features
- [x] Implement lecturer asignment with cross-faculty
- [x] Implement RPS approval workflow

## Phase 5.5: Grading & Attendance (In Progress)
- [x] Design grading system database model
- [x] Implement grading backend APIs ✅
  - [x] Database models (GradingSystem, GradeScale, AssessmentComponent, StudentGrade, FinalGrade)
  - [x] Seeders for grade scales (legacy + OBE)
  - [x] Grading config API (get/set)
  - [x] Assessment component CRUD API
  - [x] Model associations
  - [x] Student grade input API (single + batch)
  - [x] Final grade calculation API (weighted average)
  - [x] Grade approval workflow
- [x] Create grading UI for Dosen ✅
  - [x] Assessment setup page (configure components)
  - [x] Spreadsheet-like grade input
  - [x] Auto-save & validation
  - [ ] Export to Excel (optional)
- [ ] Grade reports for Mahasiswa
- [x] Design attendance system
- [x] Implement attendance backend APIs ✅
  - [x] Database model (Attendance)
  - [x] Get attendance for pertemuan
  - [x] Mark attendance (single + bulk)
  - [x] Student attendance report API
  - [x] Course attendance report API
- [x] Create attendance tracking UI ✅
  - [x] Attendance marking page (Dosen)
  - [ ] Student attendance view (Mahasiswa) - optional
  - [ ] Course attendance report (Dosen) - optional
  - [ ] Excel export - optional

## Phase 6: Essential Features (Priority 1 - WAJIB)
- [/] Student Enrollment Management
  - [ ] Database model (Enrollment)
  - [ ] Backend APIs (enroll, unenroll, list)
  - [ ] Frontend: Enrollment management UI
  - [ ] Integration with grading & attendance
- [x] RPS Creation/Edit UI for Dosen ✅ (2024-02-04)
  - [x] Backend: RPS CRUD APIs for Dosen
  - [x] Backend: getCurriculumTree for CPL→CPMK→SubCPMK
  - [x] Backend: getRPSByCourse to check existing RPS
  - [x] Excel-like editable grid interface
  - [x] Dropdown selectors with dependencies (CPL→CPMK→Sub-CPMK)
  - [x] Bulk create pertemuan
- [ ] Dashboard Analytics Enhancement
  - [ ] Grade distribution charts
  - [ ] Attendance trends charts
  - [ ] CPL attainment charts
- [ ] CPL & CPMK Achievement Analytics
  - [ ] CPL calculation algorithm (roll-up from assessments)
  - [ ] Analytics dashboard with charts
  - [ ] Class-wide CPL reports

## Phase 6.5: RPS Editor Redesign (2024-02-04) ✅
- [x] Redesign RPS Editor to match official Mahardika template
- [x] Section-based layout with 4 tabs:
  - [x] Identitas MK (course info, semester filter, rumpun dropdown+add new)
  - [x] CPL & CPMK (checkbox list CPL selection, inline CPMK/SubCPMK editors)
  - [x] Rencana Mingguan (flexible week count, multi-select metode/penilaian)
  - [x] Info Tambahan (pustaka, media, ambang batas kelulusan)
- [x] Fix navigation: Edit RPS → proper edit vs create flow
- [x] Fix backend getCurriculumTree (wrong column name kode→kode_cpl)
- [x] Add /rps/by-course/:courseId endpoint to check existing RPS
- [x] useAcademicStore integration for semester filtering

## Phase 7: Nice to Have (Priority 2)
- [ ] PDF RPS Export with Templates
- [ ] Email Notifications System
- [ ] Multiple Roles per User

## Phase 8: Advanced Features (Priority 3)
- [ ] QR Code Attendance
- [ ] Mahasiswa Self-Service Portal

## Phase 6.8: Curriculum & Theme Enhancements (2026-02-05) ✅
- [x] Curriculum Import Functionality
  - [x] CSV Import for CPL, Bahan Kajian, MK, CPMK, Sub-CPMK
  - [x] Template download integration
  - [x] "Magic" code generation for CPMK/Sub-CPMK
- [x] Batch Operations
  - [x] Batch delete for CPMK & Sub-CPMK
- [x] Theme Customization
  - [x] Notion-style profile customization (Cover Image)
  - [x] Refined Login Page responsive design
  - [x] Added Help Menu (Login & Dashboard)
- [x] View Options
  - [x] Toggle Table/Card/List view for Curriculum Data

## Phase 6.9: Curriculum Code System Enhancement (2026-02-06) ✅
- [x] Dual Code System Implementation
  - [x] Separation of Display Code (`CPL01`) and Internal Unique Code (`IF-CPL01`)
  - [x] Automatic Prodi-based prefixing (IF, KEP, KEB, RMIK, dll)
  - [x] Duplicate detection with automatic suffixing (suffix `(1)`, `(2)`, etc.)
- [x] Database & Model Updates
  - [x] Added `kode_tampilan` to 4 models (CPL, BK, CPMK, SubCPMK)
  - [x] Migrated existing data (82+ records updated)
- [x] UI/UX Improvements
  - [x] Hover tooltips for internal codes in tables
  - [x] Hover tooltips for long descriptions in dropdowns
  - [x] Role-based filtering (Super Admin vs Kaprodi)

## Known Issues & Fixes Log
| Issue | Status | Solution |
|-------|--------|----------|
| getCurriculumTree 500 error | ✅ Fixed | Changed column 'kode' to 'kode_cpl', added required:false |
| Edit RPS → "Buat RPS Baru" | ✅ Fixed | Added /rps/by-course endpoint, updated navigation logic |
| Duplicate RPS error on save | ✅ Fixed | Check currentRPSId before create, use PUT for updates |
| Column "kode_tampilan" NOT NULL error | ✅ Fixed | Made column nullable first, populated data, then (planned) NOT NULL |
| Long text in dropdown truncated | ✅ Fixed | Added `title` attribute for native browser tooltip on hover |


