# RPS Management System - Project Documentation

**Version:** Phase 5.6  
**Last Updated:** 2026-02-09  
**Status:** Curriculum Refinements & RBAC Complete
**Last Build:** 2026-02-09  
**Build Status:** ✅ Stable

---

## 📋 Project Overview

RPS (Rencana Pembelajaran Semester) Management System adalah aplikasi web untuk mengelola perencanaan pembelajaran, penilaian, dan presensi mahasiswa dengan dukungan dual-mode grading (Legacy & OBE).

**Tech Stack:**
- **Backend:** Node.js + Express + PostgreSQL + Sequelize
- **Frontend:** React + Vite + Tailwind CSS
- **Auth:** JWT-based authentication with RBAC

---

## ✅ Completed Features

### Phase 1-4: Core Foundation ✅
- ✅ Database design & implementation
- ✅ Authentication & RBAC (Role-Based Access Control)
- ✅ Organizational structure (Fakultas, Prodi, Mahasiswa, Dosen)
- ✅ Curriculum management (CPL, CPMK, Sub-CPMK)
- ✅ Course management (Mata Kuliah, RPS)
- ✅ Lecturer assignment (cross-faculty support)
- ✅ RPS approval workflow (Dosen → Kaprodi → Approved/Rejected)
- ✅ Frontend dashboard & UI integration

### Phase 5.5: Grading System ✅

**Backend APIs:**
- ✅ Dual-mode grading configuration (Legacy/OBE)
- ✅ Grade scales (Legacy: 5 grades, OBE: 9 grades)
- ✅ Assessment component management
- ✅ Student grade input (single + batch)
- ✅ Final grade calculation (weighted average)
- ✅ Auto-conversion: Angka (0-100) → Huruf (A-E) → IP (0-4.0)
- ✅ Grade approval workflow

**Frontend UI:**
- ✅ Assessment setup page (component configuration)
- ✅ Spreadsheet-like grade input interface
- ✅ Auto-save functionality
- ✅ Real-time huruf/IP conversion display
- ✅ Final grade calculation

**Key Features:**
- Support for **Legacy mode**: UTS (30%), UAS (35%), Praktikum (20%), Tugas (10%), Soft Skill (5%)
- Support for **OBE mode**: Sub-CPMK based assessment with flexible pertemuan ranges
- Weight validation (must equal 100%)
- Batch operations for efficiency

### Phase 5.5: Attendance System ✅

**Backend APIs:**
- ✅ Attendance tracking per RPS pertemuan
- ✅ 4 status types: Hadir, Izin, Sakit, Alpa
- ✅ Single & bulk attendance marking
- ✅ Student attendance report (with percentage)
- ✅ Course attendance report (class summary)

**Frontend UI:**
- ✅ Attendance marking page for Dosen
- ✅ Pertemuan selector
- ✅ Student checklist with radio buttons
- ✅ Real-time summary statistics
- ✅ Notes field for absence reasons

**Attendance Formula:**
```
Attendance % = (Hadir + Izin) / Total Pertemuan × 100
```

**Thresholds:**
- 🔴 < 75%: At risk
- 🟡 75-85%: Warning
- 🟢 > 85%: Good

---

## 📁 Project Structure

```
rps/
├── server/              # Backend (Node.js + Express)
│   ├── models/          # Sequelize models
│   ├── controllers/     # Business logic
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & validation
│   ├── seeders/         # Database seeders
│   └── server.js        # Entry point
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── lib/         # Utilities (axios, etc.)
│   │   └── utils/       # Helper functions
│   └── public/          # Static assets
└── docs/                # Documentation
```

---

## 🔑 User Roles & Permissions

| Role      | Capabilities |
|-----------|-------------|
| **Admin** | Full system access, manage all entities |
| **Dekan** | Faculty-level management, approve RPSs |
| **Kaprodi** | Program-level management, approve RPSs, configure grading |
| **Dosen** | Create/edit RPS, input grades, mark attendance |
| **Mahasiswa** | View RPS, view grades & attendance (future) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Installation

1. **Clone repository:**
   ```bash
   git clone https://github.com/bangjamz/rps-management-system.git
   cd rps-management-system
   ```

2. **Backend setup:**
   ```bash
   cd server
   npm install
   cp .env.example .env  # Configure database credentials
   npm run dev
   ```

3. **Frontend setup:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Database setup:**
   ```bash
   # Run migrations (if using migrations)
   # Or sync models
   # Seeders will create sample data
   ```

### Default Credentials
```
Admin: admin@university.edu / admin123
Kaprodi: kaprodi@university.edu / password123
Dosen: dosen@university.edu / password123
```

---

## 📊 Database Models

### Core Models
- `User` - System users with roles
- `Fakultas`, `Prodi` - Organizational structure
- `Mahasiswa`, `Dosen` - Student & lecturer data
- `MataKuliah` - Course information
- `RPS`, `RPSPertemuan` - Learning plans & meetings

### Curriculum Models
- `CPL`, `CPMK`, `SubCPMK` - Learning outcomes hierarchy

### Grading Models
- `GradingSystem` - Grading configuration per prodi/semester
- `GradeScale`, `GradeScaleDetail` - Grade conversion tables
- `AssessmentComponent` - Assessment components (UTS/UAS/Sub-CPMK)
- `StudentGrade` - Individual component scores
- `FinalGrade` - Aggregated final grades

### Attendance Model
- `Attendance` - Per-pertemuan attendance records

---

## 🛣️ API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Grading
- `GET /api/grading/config` - Get grading configuration
- `POST /api/grading/config` - Set grading mode (legacy/OBE)
- `GET /api/grading/components` - Get assessment components
- `POST /api/grading/components` - Create component
- `POST /api/grading/student-grades` - Input grade
- `POST /api/grading/student-grades/batch` - Batch input
- `POST /api/grading/final-grades/calculate` - Calculate final grade
- `POST /api/grading/final-grades/approve` - Approve grades

### Attendance
- `GET /api/attendance/pertemuan/:id` - Get pertemuan attendance
- `POST /api/attendance/mark` - Mark single attendance
- `POST /api/attendance/bulk-mark` - Bulk mark attendance
- `GET /api/attendance/report/student/:id` - Student report
- `GET /api/attendance/report/course/:id` - Course report

### RPS
- `GET /api/rps` - List RPS documents
- `GET /api/rps/:id` - Get RPS detail
- `POST /api/rps` - Create RPS
- `PUT /api/rps/:id` - Update RPS
- `POST /api/rps/:id/approve` - Approve RPS
- `POST /api/rps/:id/reject` - Reject RPS

---

## 📖 Design Documents

For detailed design specifications, see:
- [Grading System Design](./grading_system_design.md)
- [Attendance System Design](./attendance_system_design.md)

---

## 🔮 Future Enhancements

### Priority 1 (High Impact)
1. **Student Enrollment Management**
   - Assign students to courses
   - Currently using mock data
   
2. **RPS Creation/Edit UI for Dosen**
   - Dosen self-service RPS management
   
3. **Dashboard Analytics**
   - CPL attainment charts
   - Grade distribution graphs
   - Attendance trends

### Priority 2 (Medium Impact)
4. **PDF Export & Templates**
   - Customizable RPS templates
   - Logo/header placement
   
5. **Email Notifications**
   - RPS approval/rejection
   - Grade submission
   - Low attendance warnings

6. **Multiple Roles per User**
   - Role switcher UI
   - Support Kaprodi + Dosen simultaneously

### Priority 3 (Nice to Have)
7. **QR Code Attendance**
8. **Mahasiswa Self-Service Portal**
9. **CPL Achievement Analytics**

---

## 🧪 Testing

```bash
# Backend tests (if implemented)
cd server
npm test

# Frontend tests (if implemented)
cd client
npm test
```

---

## 📝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

---

## 📄 License

[To be determined]

---

## 👥 Team

- **Developer:** [Your Name]
- **Institution:** [University Name]
- **Project Type:** RPS Management System

---

## 📞 Support

For questions or issues, please contact:
- Email: [support email]
- GitHub Issues: [repository]/issues

---

**Last Build:** 2026-02-04  
**Build Status:** ✅ Stable
