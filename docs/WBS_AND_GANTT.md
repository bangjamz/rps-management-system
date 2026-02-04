# Work Breakdown Structure (WBS) & Project Timeline

**RPS Management System - Complete Project Structure**  
**Last Updated:** 2026-02-04  
**Version:** Phase 6+

---

## 📋 Work Breakdown Structure (WBS)

### Level 1: RPS Management System (SIAKAD)

```
1.0 RPS Management System
├── 1.1 Project Planning & Design
├── 1.2 Infrastructure Setup
├── 1.3 Core System Development
├── 1.4 Advanced Features
├── 1.5 Testing & QA
└── 1.6 Deployment & Documentation
```

---

### Level 2: Detailed Breakdown

#### **1.1 Project Planning & Design**
- 1.1.1 Requirements gathering
- 1.1.2 Database schema design
- 1.1.3 API endpoint planning
- 1.1.4 UI/UX wireframing
- 1.1.5 Technical architecture documentation

#### **1.2 Infrastructure Setup**
- 1.2.1 GitHub repository creation
- 1.2.2 Development environment setup
  - 1.2.2.1 Backend (Node.js + Express + PostgreSQL)
  - 1.2.2.2 Frontend (React + Vite + Tailwind)
- 1.2.3 Database initialization
- 1.2.4 Authentication system (JWT + bcrypt)

#### **1.3 Core System Development**

##### **1.3.1 Phase 1: Foundation (✅ Complete)**
- 1.3.1.1 Database models (21 tables)
- 1.3.1.2 Model associations (45+ relationships)
- 1.3.1.3 Seed data creation
- 1.3.1.4 RBAC middleware implementation

##### **1.3.2 Phase 2: Organizational Management (✅ Complete)**
- 1.3.2.1 Fakultas & Prodi APIs
- 1.3.2.2 Mahasiswa & Dosen management
- 1.3.2.3 Curriculum management (CPL, CPMK, Sub-CPMK)
- 1.3.2.4 Course catalog (Mata Kuliah)

##### **1.3.3 Phase 3: RPS System (✅ Complete)**
- 1.3.3.1 RPS CRUD APIs (backend)
- 1.3.3.2 RPS approval workflow
- 1.3.3.3 Lecturer assignment (cross-faculty)
- 1.3.3.4 RPS viewer UI (frontend)
- 1.3.3.5 RPS approval UI (Kaprodi)

##### **1.3.4 Phase 4: Frontend Integration (✅ Complete)**
- 1.3.4.1 Dashboard layout
- 1.3.4.2 Navigation & routing
- 1.3.4.3 Role-based UI components
- 1.3.4.4 Data visualization (tables, cards)

##### **1.3.5 Phase 5: Grading System (✅ Complete)**
- 1.3.5.1 Dual-mode grading backend
  - 1.3.5.1.1 GradingSystem model
  - 1.3.5.1.2 GradeScale + GradeScaleDetail
  - 1.3.5.1.3 AssessmentComponent (legacy/OBE)
  - 1.3.5.1.4 StudentGrade + FinalGrade
  - 1.3.5.1.5 6 grading APIs
- 1.3.5.2 Grading frontend
  - 1.3.5.2.1 Assessment setup page
  - 1.3.5.2.2 Grade input page (spreadsheet-like)
  - 1.3.5.2.3 Auto-save functionality

##### **1.3.6 Phase 5: Attendance System (✅ Complete)**
- 1.3.6.1 Attendance backend
  - 1.3.6.1.1 Attendance model (4 status types)
  - 1.3.6.1.2 5 attendance APIs
  - 1.3.6.1.3 Percentage calculation
- 1.3.6.2 Attendance frontend
  - 1.3.6.2.1 Attendance marking page
  - 1.3.6.2.2 Summary statistics

#### **1.4 Advanced Features (Phase 6-8)**

##### **1.4.1 Phase 6: Essential Features (Priority 1 - WAJIB)**
- 1.4.1.1 Student Enrollment System (✅ Complete)
  - 1.4.1.1.1 Enrollment model
  - 1.4.1.1.2 6 enrollment APIs
  - 1.4.1.1.3 Enrollment management UI
  - 1.4.1.1.4 Integration with grading/attendance
  
- 1.4.1.2 RPS Creation/Edit UI (🔄 In Progress)
  - 1.4.1.2.1 RPS CRUD APIs for Dosen
  - 1.4.1.2.2 Excel-like editable grid
  - 1.4.1.2.3 CPL→CPMK→Sub-CPMK dropdowns
  - 1.4.1.2.4 Bulk pertemuan creation
  - 1.4.1.2.5 Auto-save functionality
  
- 1.4.1.3 Dashboard Analytics
  - 1.4.1.3.1 Grade distribution charts
  - 1.4.1.3.2 Attendance trend charts
  - 1.4.1.3.3 CPL attainment charts
  - 1.4.1.3.4 Interactive filters
  
- 1.4.1.4 CPL Achievement Analytics
  - 1.4.1.4.1 CPL calculation algorithm
  - 1.4.1.4.2 Roll-up logic (Assessment→Sub-CPMK→CPMK→CPL)
  - 1.4.1.4.3 Analytics dashboard
  - 1.4.1.4.4 Radar/heatmap charts
  - 1.4.1.4.5 Export reports

##### **1.4.2 Phase 7: Nice to Have (Priority 2)**
- 1.4.2.1 PDF RPS Export
  - 1.4.2.1.1 Template engine setup (Puppeteer)
  - 1.4.2.1.2 Customizable templates
  - 1.4.2.1.3 Logo/header placement
  - 1.4.2.1.4 Export API endpoint
  
- 1.4.2.2 Email Notifications
  - 1.4.2.2.1 Nodemailer setup
  - 1.4.2.2.2 Notification settings UI
  - 1.4.2.2.3 Custom message templates
  - 1.4.2.2.4 Variable replacement engine
  - 1.4.2.2.5 Bulk send functionality
  
- 1.4.2.3 Multiple Roles per User
  - 1.4.2.3.1 User model update (roles array)
  - 1.4.2.3.2 Permission middleware update
  - 1.4.2.3.3 Role switcher UI
  - 1.4.2.3.4 Testing multi-role scenarios

##### **1.4.3 Phase 8: Advanced Features (Priority 3)**
- 1.4.3.1 QR Code Attendance
  - 1.4.3.1.1 QR generation API
  - 1.4.3.1.2 Token-based validation
  - 1.4.3.1.3 Student scan interface
  - 1.4.3.1.4 Time window enforcement
  
- 1.4.3.2 Mahasiswa Self-Service Portal
  - 1.4.3.2.1 Mahasiswa dashboard
  - 1.4.3.2.2 My grades page
  - 1.4.3.2.3 My attendance page
  - 1.4.3.2.4 Course RPS viewer

#### **1.5 Testing & Quality Assurance**
- 1.5.1 Unit testing (backend)
- 1.5.2 Integration testing
- 1.5.3 E2E testing (frontend)
- 1.5.4 RBAC testing (all roles)
- 1.5.5 Performance testing
- 1.5.6 Security audit

#### **1.6 Deployment & Documentation**
- 1.6.1 Production database setup
- 1.6.2 Server deployment
- 1.6.3 Client build & hosting
- 1.6.4 User documentation
  - 1.6.4.1 Admin guide
  - 1.6.4.2 Lecturer guide
  - 1.6.4.3 Student guide
- 1.6.5 Technical documentation (✅ Complete)
  - 1.6.5.1 README.md
  - 1.6.5.2 Database schema
  - 1.6.5.3 API documentation
  - 1.6.5.4 Design documents
  - 1.6.5.5 Walkthroughs

---

## 📅 Gantt Chart (Text-Based)

```
Project Timeline: Phase 1-8
Duration: ~100 hours (14 weeks @ 7h/week)

Legend:
█ Completed
▓ In Progress
░ Planned
```

### Phase 1-5 (COMPLETED) ✅

```
Task                              Week 1  Week 2  Week 3  Week 4  Week 5  Week 6
--------------------------------------------------------------------------------
1.1 Planning & Design             ████
1.2 Infrastructure Setup          ████
1.3.1 Phase 1: Foundation         ████
1.3.2 Phase 2: Org Management             ████
1.3.3 Phase 3: RPS System                         ████
1.3.4 Phase 4: Frontend Int.                              ████
1.3.5 Phase 5: Grading                                            ████
1.3.6 Phase 5: Attendance                                                 ████
```

### Phase 6-8 (PLANNED/IN PROGRESS)

```
Task                              Week 7  Week 8  Week 9  Week 10 Week 11 Week 12 Week 13 Week 14
--------------------------------------------------------------------------------------------------
1.4.1.1 Student Enrollment        ████
1.4.1.2 RPS Creation UI           ▓▓▓░
1.4.1.3 Dashboard Analytics                       ░░░░
1.4.1.4 CPL Analytics                             ░░░░░░░░
1.4.2.1 PDF Export                                                ░░░░
1.4.2.2 Email Notifications                                               ░░░░
1.4.2.3 Multiple Roles                                                            ░░░░
1.4.3.1 QR Attendance                                                                     ░░░░
1.4.3.2 Mahasiswa Portal                                                                  ░░░░░░░░
1.5 Testing & QA                  ░       ░       ░       ░       ░       ░       ░       ░░░░
1.6 Deployment                                                                                    ░░░░
```

### Detailed Timeline with Hours

| Week | Phase | Task | Hours | Status |
|------|-------|------|-------|--------|
| 1 | 1 | Planning & Design | 8h | ✅ Complete |
| 1 | 2 | Infrastructure Setup | 6h | ✅ Complete |
| 2 | 1 | Database Models | 12h | ✅ Complete |
| 3 | 2 | Organizational APIs | 10h | ✅ Complete |
| 4 | 3 | RPS System Backend | 14h | ✅ Complete |
| 5 | 4 | Frontend Integration | 12h | ✅ Complete |
| 6 | 5 | Grading System | 18h | ✅ Complete |
| 6 | 5 | Attendance System | 10h | ✅ Complete |
| **7** | **6.1** | **Student Enrollment** | **6h** | ✅ **Complete** |
| **7-8** | **6.2** | **RPS Creation UI** | **12h** | 🔄 **In Progress** |
| 8-9 | 6.3 | Dashboard Analytics | 8h | ⏳ Planned |
| 9-10 | 6.4 | CPL Analytics | 15h | ⏳ Planned |
| 10 | 7.1 | PDF Export | 7h | ⏳ Planned |
| 11 | 7.2 | Email Notifications | 8h | ⏳ Planned |
| 11 | 7.3 | Multiple Roles | 5h | ⏳ Planned |
| 12 | 8.1 | QR Attendance | 5h | ⏳ Planned |
| 12-13 | 8.2 | Mahasiswa Portal | 10h | ⏳ Planned |
| 14 | - | Testing & Deployment | 8h | ⏳ Planned |

---

## 📊 Progress Metrics

### Overall Progress

```
Total Tasks: 60 items
Completed:   45 items (75%)
In Progress: 1 item  (2%)
Planned:     14 items (23%)
```

### Phase Completion

| Phase | Status | Completion | Hours Spent | Hours Remaining |
|-------|--------|------------|-------------|-----------------|
| Phase 1-2 | ✅ Complete | 100% | 36h | 0h |
| Phase 3-4 | ✅ Complete | 100% | 26h | 0h |
| Phase 5 | ✅ Complete | 100% | 28h | 0h |
| **Phase 6** | 🔄 **In Progress** | **20%** | **6h** | **35h** |
| Phase 7 | ⏳ Planned | 0% | 0h | 20h |
| Phase 8 | ⏳ Planned | 0% | 0h | 15h |

**Total:** 96h spent / ~100h estimated

---

## 🎯 Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| M1: Core System Ready | Week 4 | ✅ Achieved |
| M2: RPS Workflow Complete | Week 5 | ✅ Achieved |
| M3: Grading & Attendance | Week 6 | ✅ Achieved |
| M4: Essential Features (Phase 6) | Week 10 | 🔄 In Progress |
| M5: Full SIAKAD Features (Phase 7-8) | Week 13 | ⏳ Planned |
| M6: Production Deployment | Week 14 | ⏳ Planned |

---

## 🚀 Critical Path

**Critical path items (blocking subsequent work):**

1. ✅ Database setup → Enables all features
2. ✅ Authentication & RBAC → Secures all endpoints
3. ✅ Student Enrollment → Enables real data in grading/attendance
4. 🔄 RPS Creation UI → Enables Dosen self-service
5. ⏳ CPL Analytics → Required for reporting
6. ⏳ Testing → Required for deployment

---

## 📝 Dependencies Map

```
Database Schema
  └── Authentication System
        ├── Organizational APIs (Fakultas, Prodi, etc.)
        │     ├── Curriculum Management (CPL, CPMK)
        │     └── Course Management
        │           ├── RPS System
        │           │     ├── RPS Approval Workflow
        │           │     └── Attendance System
        │           ├── Student Enrollment ← CRITICAL
        │           │     ├── Grading System (real data)
        │           │     └── Attendance (real data)
        │           └── RPS Creation UI
        │                 └── CPL Analytics
        │                       └── Dashboard Analytics
        └── Advanced Features (Phase 7-8)
              ├── PDF Export
              ├── Email Notifications
              ├── Multiple Roles
              ├── QR Attendance
              └── Mahasiswa Portal
```

---

## 💡 Resource Allocation

**Estimated effort by category:**

| Category | Hours | Percentage |
|----------|-------|------------|
| Backend Development | 55h | 55% |
| Frontend Development | 30h | 30% |
| Database Design | 8h | 8% |
| Testing & QA | 5h | 5% |
| Documentation | 2h | 2% |
| **Total** | **100h** | **100%** |

---

## 🔧 Technology Stack Timeline

```
Week 1-2:   PostgreSQL, Sequelize, Express.js, JWT
Week 3-4:   React, Vite, Tailwind CSS, React Router
Week 5-6:   Advanced state management, API integration
Week 7-10:  react-data-grid, Recharts (for analytics)
Week 11-12: Puppeteer (PDF), Nodemailer (Email), QRCode
Week 13-14: Testing frameworks, Deployment tools
```

---

**Generated:** 2026-02-04  
**Next Update:** After Phase 6 completion  
**Maintained by:** Development Team
