// Import all models
import User from './User.js';
import Institusi from './Institusi.js';
import Fakultas from './Fakultas.js';
import Prodi from './Prodi.js';
import ProfilLulusan from './ProfilLulusan.js';
import CPL from './CPL.js';
import MataKuliah from './MataKuliah.js';
import CPMK from './CPMK.js';
import SubCPMK from './SubCPMK.js';
import BahanKajian from './BahanKajian.js';
import MKBahanKajian from './MKBahanKajian.js';
import Mahasiswa from './Mahasiswa.js';
import RPS from './RPS.js';
import RPSPertemuan from './RPSPertemuan.js';
import PertemuanCPMK from './PertemuanCPMK.js';
import PenilaianMK from './PenilaianMK.js';
import NilaiMahasiswa from './NilaiMahasiswa.js';
import DosenAssignment from './DosenAssignment.js';
import GradingSystem from './GradingSystem.js';
import GradeScale from './GradeScale.js';
import GradeScaleDetail from './GradeScaleDetail.js';
import AssessmentComponent from './AssessmentComponent.js';
import StudentGrade from './StudentGrade.js';
import FinalGrade from './FinalGrade.js';
import Attendance from './Attendance.js';
import Enrollment from './Enrollment.js';

// Define associations

// ========== ORGANIZATIONAL HIERARCHY ==========
// Institusi → Fakultas relationship
Institusi.hasMany(Fakultas, { foreignKey: 'institusi_id', as: 'fakultas' });
Fakultas.belongsTo(Institusi, { foreignKey: 'institusi_id', as: 'institusi' });

// Fakultas → Prodi relationship
Fakultas.hasMany(Prodi, { foreignKey: 'fakultas_id', as: 'prodi' });
Prodi.belongsTo(Fakultas, { foreignKey: 'fakultas_id', as: 'fakultas' });

// Fakultas → User (Dekan) relationship
Fakultas.belongsTo(User, { foreignKey: 'dekan_user_id', as: 'dekan' });
User.hasOne(Fakultas, { foreignKey: 'dekan_user_id', as: 'fakultas_led' });

// Prodi → User (Kaprodi) relationship
Prodi.belongsTo(User, { foreignKey: 'kaprodi_user_id', as: 'kaprodi' });
User.hasOne(Prodi, { foreignKey: 'kaprodi_user_id', as: 'prodi_led' });

// ========== USER ORGANIZATIONAL ASSIGNMENTS ==========
// User → Institusi (for admin_institusi)
Institusi.hasMany(User, { foreignKey: 'institusi_id', as: 'admin_users' });
User.belongsTo(Institusi, { foreignKey: 'institusi_id', as: 'institusi' });

// User → Fakultas (for dekan and cross-faculty staff)
Fakultas.hasMany(User, { foreignKey: 'fakultas_id', as: 'users' });
User.belongsTo(Fakultas, { foreignKey: 'fakultas_id', as: 'fakultas' });

// User → Prodi (for kaprodi, dosen, mahasiswa)
Prodi.hasMany(User, { foreignKey: 'prodi_id', as: 'users' });
User.belongsTo(Prodi, { foreignKey: 'prodi_id', as: 'prodi' });

// ========== CPL MULTI-LEVEL HIERARCHY ==========
// Institusi → CPL relationship (institut-level CPLs)
Institusi.hasMany(CPL, { foreignKey: 'institusi_id', as: 'cpl' });
CPL.belongsTo(Institusi, { foreignKey: 'institusi_id', as: 'institusi' });

// Fakultas → CPL relationship (fakultas-level CPLs)
Fakultas.hasMany(CPL, { foreignKey: 'fakultas_id', as: 'cpl' });
CPL.belongsTo(Fakultas, { foreignKey: 'fakultas_id', as: 'fakultas' });

// Prodi → CPL relationship (prodi-level CPLs)
Prodi.hasMany(CPL, { foreignKey: 'prodi_id', as: 'cpl' });
CPL.belongsTo(Prodi, { foreignKey: 'prodi_id', as: 'prodi' });

// Prodi → Profil Lulusan relationship
Prodi.hasMany(ProfilLulusan, { foreignKey: 'prodi_id', as: 'profil_lulusan' });
ProfilLulusan.belongsTo(Prodi, { foreignKey: 'prodi_id', as: 'prodi' });

Prodi.hasMany(MataKuliah, { foreignKey: 'prodi_id', as: 'mata_kuliah' });
MataKuliah.belongsTo(Prodi, { foreignKey: 'prodi_id', as: 'prodi' });

Prodi.hasMany(Mahasiswa, { foreignKey: 'prodi_id', as: 'mahasiswa' });
Mahasiswa.belongsTo(Prodi, { foreignKey: 'prodi_id', as: 'prodi' });

//PL -> CPL relationship
ProfilLulusan.hasMany(CPL, { foreignKey: 'pl_id', as: 'cpl' });
CPL.belongsTo(ProfilLulusan, { foreignKey: 'pl_id', as: 'profil_lulusan' });

// Mata Kuliah -> CPMK relationship
MataKuliah.hasMany(CPMK, { foreignKey: 'mata_kuliah_id', as: 'cpmk' });
CPMK.belongsTo(MataKuliah, { foreignKey: 'mata_kuliah_id', as: 'mata_kuliah' });

// CPL -> CPMK relationship (optional mapping)
CPL.hasMany(CPMK, { foreignKey: 'cpl_id', as: 'cpmk' });
CPMK.belongsTo(CPL, { foreignKey: 'cpl_id', as: 'cpl' });

// CPMK -> Sub-CPMK relationship
CPMK.hasMany(SubCPMK, { foreignKey: 'cpmk_id', as: 'sub_cpmk' });
SubCPMK.belongsTo(CPMK, { foreignKey: 'cpmk_id', as: 'cpmk' });

// User -> CPMK relationship (created_by)
User.hasMany(CPMK, { foreignKey: 'created_by', as: 'created_cpmk' });
CPMK.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Mata Kuliah <-> Bahan Kajian (many-to-many via junction table)
MataKuliah.belongsToMany(BahanKajian, {
    through: MKBahanKajian,
    foreignKey: 'mata_kuliah_id',
    otherKey: 'bahan_kajian_id',
    as: 'bahan_kajian'
});
BahanKajian.belongsToMany(MataKuliah, {
    through: MKBahanKajian,
    foreignKey: 'bahan_kajian_id',
    otherKey: 'mata_kuliah_id',
    as: 'mata_kuliah'
});

// ========== DOSEN ASSIGNMENT ==========
// DosenAssignment relationships
User.hasMany(DosenAssignment, { foreignKey: 'dosen_id', as: 'assignments' });
DosenAssignment.belongsTo(User, { foreignKey: 'dosen_id', as: 'dosen' });

MataKuliah.hasMany(DosenAssignment, { foreignKey: 'mata_kuliah_id', as: 'assignments' });
DosenAssignment.belongsTo(MataKuliah, { foreignKey: 'mata_kuliah_id', as: 'mata_kuliah' });

User.hasMany(DosenAssignment, { foreignKey: 'assigned_by', as: 'assignments_made' });
DosenAssignment.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigner' });

// ========== RPS RELATIONSHIPS ==========
// RPS → MataKuliah
MataKuliah.hasMany(RPS, { foreignKey: 'mata_kuliah_id', as: 'rps' });
RPS.belongsTo(MataKuliah, { foreignKey: 'mata_kuliah_id', as: 'mata_kuliah' });

// RPS → DosenAssignment (for instances, null for templates)
DosenAssignment.hasMany(RPS, { foreignKey: 'assignment_id', as: 'rps_instances' });
RPS.belongsTo(DosenAssignment, { foreignKey: 'assignment_id', as: 'assignment' });

// RPS → User (Dosen who created)
User.hasMany(RPS, { foreignKey: 'dosen_id', as: 'rps_dibuat' });
RPS.belongsTo(User, { foreignKey: 'dosen_id', as: 'dosen' });

// RPS → User (Kaprodi who approved)
User.hasMany(RPS, { foreignKey: 'approved_by', as: 'rps_approved' });
RPS.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// RPS Template → RPS Instance (self-referencing)
RPS.hasMany(RPS, { foreignKey: 'template_id', as: 'instances' });
RPS.belongsTo(RPS, { foreignKey: 'template_id', as: 'template' });

// RPS -> RPS Pertemuan relationship
RPS.hasMany(RPSPertemuan, { foreignKey: 'rps_id', as: 'pertemuan' });
RPSPertemuan.belongsTo(RPS, { foreignKey: 'rps_id', as: 'rps' });

// RPS Pertemuan -> CPMK/Sub-CPMK (via junction table)
RPSPertemuan.hasMany(PertemuanCPMK, { foreignKey: 'pertemuan_id', as: 'cpmk_mapping' });
PertemuanCPMK.belongsTo(RPSPertemuan, { foreignKey: 'pertemuan_id', as: 'pertemuan' });

CPMK.hasMany(PertemuanCPMK, { foreignKey: 'cpmk_id', as: 'pertemuan_mapping' });
PertemuanCPMK.belongsTo(CPMK, { foreignKey: 'cpmk_id', as: 'cpmk' });

SubCPMK.hasMany(PertemuanCPMK, { foreignKey: 'sub_cpmk_id', as: 'pertemuan_mapping' });
PertemuanCPMK.belongsTo(SubCPMK, { foreignKey: 'sub_cpmk_id', as: 'sub_cpmk' });

// ========== GRADING SYSTEM ==========
// GradingSystem -> Prodi
GradingSystem.belongsTo(Prodi, { foreignKey: 'prodi_id', as: 'prodi' });
Prodi.hasMany(GradingSystem, { foreignKey: 'prodi_id', as: 'gradingSystems' });

// GradingSystem -> GradeScale
GradingSystem.belongsTo(GradeScale, { foreignKey: 'grade_scale_id', as: 'gradeScale' });
GradeScale.hasMany(GradingSystem, { foreignKey: 'grade_scale_id', as: 'gradingSystems' });

// GradeScale -> GradeScaleDetails
GradeScale.hasMany(GradeScaleDetail, { foreignKey: 'grade_scale_id', as: 'details' });
GradeScaleDetail.belongsTo(GradeScale, { foreignKey: 'grade_scale_id', as: 'gradeScale' });

// AssessmentComponent -> MataKuliah
AssessmentComponent.belongsTo(MataKuliah, { foreignKey: 'mata_kuliah_id', as: 'mataKuliah' });
MataKuliah.hasMany(AssessmentComponent, { foreignKey: 'mata_kuliah_id', as: 'assessmentComponents' });

// AssessmentComponent -> SubCPMK (OBE mode)
AssessmentComponent.belongsTo(SubCPMK, { foreignKey: 'sub_cpmk_id', as: 'subCpmk' });
SubCPMK.hasMany(AssessmentComponent, { foreignKey: 'sub_cpmk_id', as: 'assessmentComponents' });

// StudentGrade -> Mahasiswa
StudentGrade.belongsTo(Mahasiswa, { foreignKey: 'mahasiswa_id', as: 'mahasiswa' });
Mahasiswa.hasMany(StudentGrade, { foreignKey: 'mahasiswa_id', as: 'studentGrades' });

// StudentGrade -> MataKuliah
StudentGrade.belongsTo(MataKuliah, { foreignKey: 'mata_kuliah_id', as: 'mataKuliah' });
MataKuliah.hasMany(StudentGrade, { foreignKey: 'mata_kuliah_id', as: 'studentGrades' });

// StudentGrade -> AssessmentComponent
StudentGrade.belongsTo(AssessmentComponent, { foreignKey: 'assessment_component_id', as: 'assessmentComponent' });
AssessmentComponent.hasMany(StudentGrade, { foreignKey: 'assessment_component_id', as: 'studentGrades' });

// StudentGrade -> User (graded_by)
StudentGrade.belongsTo(User, { foreignKey: 'graded_by', as: 'gradedBy' });
User.hasMany(StudentGrade, { foreignKey: 'graded_by', as: 'gradesGiven' });

// FinalGrade -> Mahasiswa
FinalGrade.belongsTo(Mahasiswa, { foreignKey: 'mahasiswa_id', as: 'mahasiswa' });
Mahasiswa.hasMany(FinalGrade, { foreignKey: 'mahasiswa_id', as: 'finalGrades' });

// FinalGrade -> MataKuliah
FinalGrade.belongsTo(MataKuliah, { foreignKey: 'mata_kuliah_id', as: 'mataKuliah' });
MataKuliah.hasMany(FinalGrade, { foreignKey: 'mata_kuliah_id', as: 'finalGrades' });

// FinalGrade -> GradingSystem
FinalGrade.belongsTo(GradingSystem, { foreignKey: 'grading_system_id', as: 'gradingSystem' });
GradingSystem.hasMany(FinalGrade, { foreignKey: 'grading_system_id', as: 'finalGrades' });

// FinalGrade -> User (approved_by)
FinalGrade.belongsTo(User, { foreignKey: 'approved_by', as: 'approvedBy' });
User.hasMany(FinalGrade, { foreignKey: 'approved_by', as: 'gradesApproved' });

// ========== ATTENDANCE ==========
// Attendance -> Mahasiswa
Attendance.belongsTo(Mahasiswa, { foreignKey: 'mahasiswa_id', as: 'mahasiswa' });
Mahasiswa.hasMany(Attendance, { foreignKey: 'mahasiswa_id', as: 'attendance' });

// Attendance -> RPSPertemuan
Attendance.belongsTo(RPSPertemuan, { foreignKey: 'rps_pertemuan_id', as: 'rpsPertemuan' });
RPSPertemuan.hasMany(Attendance, { foreignKey: 'rps_pertemuan_id', as: 'attendance' });

// Attendance -> User (marked_by)
Attendance.belongsTo(User, { foreignKey: 'marked_by', as: 'markedBy' });
User.hasMany(Attendance, { foreignKey: 'marked_by', as: 'attendanceMarked' });

// ========== ENROLLMENT ==========
// Enrollment -> Mahasiswa
Enrollment.belongsTo(Mahasiswa, { foreignKey: 'mahasiswa_id', as: 'mahasiswa' });
Mahasiswa.hasMany(Enrollment, { foreignKey: 'mahasiswa_id', as: 'enrollments' });

// Enrollment -> MataKuliah
Enrollment.belongsTo(MataKuliah, { foreignKey: 'mata_kuliah_id', as: 'mataKuliah' });
MataKuliah.hasMany(Enrollment, { foreignKey: 'mata_kuliah_id', as: 'enrollments' });

// RPS -> Penilaian MK relationship
RPS.hasMany(PenilaianMK, { foreignKey: 'rps_id', as: 'penilaian' });
PenilaianMK.belongsTo(RPS, { foreignKey: 'rps_id', as: 'rps' });

// Penilaian MK -> Nilai Mahasiswa relationship
PenilaianMK.hasMany(NilaiMahasiswa, { foreignKey: 'penilaian_mk_id', as: 'nilai_mahasiswa' });
NilaiMahasiswa.belongsTo(PenilaianMK, { foreignKey: 'penilaian_mk_id', as: 'penilaian' });

// Mahasiswa -> Nilai relationship
Mahasiswa.hasMany(NilaiMahasiswa, { foreignKey: 'mahasiswa_id', as: 'nilai' });
NilaiMahasiswa.belongsTo(Mahasiswa, { foreignKey: 'mahasiswa_id', as: 'mahasiswa' });

// CPL/CPMK/Sub-CPMK -> Nilai relationship
CPL.hasMany(NilaiMahasiswa, { foreignKey: 'cpl_id', as: 'nilai' });
NilaiMahasiswa.belongsTo(CPL, { foreignKey: 'cpl_id', as: 'cpl' });

CPMK.hasMany(NilaiMahasiswa, { foreignKey: 'cpmk_id', as: 'nilai' });
NilaiMahasiswa.belongsTo(CPMK, { foreignKey: 'cpmk_id', as: 'cpmk' });

SubCPMK.hasMany(NilaiMahasiswa, { foreignKey: 'sub_cpmk_id', as: 'nilai' });
NilaiMahasiswa.belongsTo(SubCPMK, { foreignKey: 'sub_cpmk_id', as: 'sub_cpmk' });

// Export all models
export {
    User,
    Institusi,
    Fakultas,
    Prodi,
    ProfilLulusan,
    CPL,
    MataKuliah,
    CPMK,
    SubCPMK,
    BahanKajian,
    MKBahanKajian,
    Mahasiswa,
    RPS,
    RPSPertemuan,
    PertemuanCPMK,
    PenilaianMK,
    NilaiMahasiswa,
    DosenAssignment,
    GradingSystem,
    GradeScale,
    GradeScaleDetail,
    AssessmentComponent,
    StudentGrade,
    FinalGrade,
    Attendance,
    Enrollment
};
