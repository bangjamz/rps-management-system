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
- [ ] RPS Creation/Edit UI for Dosen
  - [ ] Backend: RPS CRUD APIs for Dosen
  - [ ] Excel-like editable grid interface
  - [ ] Dropdown selectors with dependencies (CPL→CPMK→Sub-CPMK)
  - [ ] Bulk create pertemuan
- [ ] Dashboard Analytics Enhancement
  - [ ] Grade distribution charts
  - [ ] Attendance trends charts
  - [ ] CPL attainment charts
- [ ] CPL & CPMK Achievement Analytics
  - [ ] CPL calculation algorithm (roll-up from assessments)
  - [ ] Analytics dashboard with charts
  - [ ] Class-wide CPL reports

## Phase 7: Nice to Have (Priority 2)
- [ ] PDF RPS Export with Templates
- [ ] Email Notifications System
- [ ] Multiple Roles per User

## Phase 8: Advanced Features (Priority 3)
- [ ] QR Code Attendance
- [ ] Mahasiswa Self-Service Portal
