import {
    Enrollment,
    Mahasiswa,
    MataKuliah,
    Prodi,
    User
} from '../models/index.js';

/**
 * Get all enrollments for a course
 */
export const getCourseEnrollments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { semester, tahunAjaran, status } = req.query;

        const where = { mata_kuliah_id: courseId };
        if (semester) where.semester = semester;
        if (tahunAjaran) where.tahun_ajaran = tahunAjaran;
        if (status) where.status = status;

        const enrollments = await Enrollment.findAll({
            where,
            include: [
                {
                    model: Mahasiswa,
                    as: 'mahasiswa',
                    attributes: ['id', 'npm', 'nama', 'email']
                }
            ],
            order: [[{ model: Mahasiswa, as: 'mahasiswa' }, 'npm', 'ASC']]
        });

        res.json(enrollments);
    } catch (error) {
        console.error('Error fetching course enrollments:', error);
        res.status(500).json({ message: 'Failed to fetch enrollments' });
    }
};

/**
 * Get all courses for a student
 */
export const getStudentEnrollments = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester, tahunAjaran, status } = req.query;

        const where = { mahasiswa_id: studentId };
        if (semester) where.semester = semester;
        if (tahunAjaran) where.tahun_ajaran = tahunAjaran;
        if (status) where.status = status;

        const enrollments = await Enrollment.findAll({
            where,
            include: [
                {
                    model: MataKuliah,
                    as: 'mataKuliah',
                    attributes: ['id', 'kode_mk', 'nama_mk', 'sks']
                }
            ],
            order: [['enrolled_at', 'DESC']]
        });

        res.json(enrollments);
    } catch (error) {
        console.error('Error fetching student enrollments:', error);
        res.status(500).json({ message: 'Failed to fetch enrollments' });
    }
};

/**
 * Enroll student(s) to a course
 */
export const enrollStudents = async (req, res) => {
    try {
        const { mata_kuliah_id, mahasiswa_ids, semester, tahun_ajaran } = req.body;

        if (!mata_kuliah_id || !mahasiswa_ids || !Array.isArray(mahasiswa_ids)) {
            return res.status(400).json({
                message: 'Required: mata_kuliah_id, mahasiswa_ids (array)'
            });
        }

        if (!semester || !tahun_ajaran) {
            return res.status(400).json({
                message: 'Required: semester, tahun_ajaran'
            });
        }

        const results = [];
        const errors = [];

        for (const mahasiswa_id of mahasiswa_ids) {
            try {
                const [enrollment, created] = await Enrollment.findOrCreate({
                    where: {
                        mahasiswa_id,
                        mata_kuliah_id,
                        semester,
                        tahun_ajaran
                    },
                    defaults: {
                        status: 'Active',
                        enrolled_at: new Date()
                    }
                });

                if (created) {
                    results.push({ mahasiswa_id, status: 'enrolled' });
                } else {
                    // If already exists but dropped, reactivate
                    if (enrollment.status === 'Dropped') {
                        await enrollment.update({ status: 'Active', enrolled_at: new Date() });
                        results.push({ mahasiswa_id, status: 'reactivated' });
                    } else {
                        results.push({ mahasiswa_id, status: 'already_enrolled' });
                    }
                }
            } catch (err) {
                errors.push({ mahasiswa_id, error: err.message });
            }
        }

        res.json({
            success: results.length,
            failed: errors.length,
            results,
            errors
        });
    } catch (error) {
        console.error('Error enrolling students:', error);
        res.status(500).json({ message: 'Failed to enroll students' });
    }
};

/**
 * Unenroll (drop) a student from a course
 */
export const unenrollStudent = async (req, res) => {
    try {
        const { enrollmentId } = req.params;

        const enrollment = await Enrollment.findByPk(enrollmentId);
        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        await enrollment.update({
            status: 'Dropped',
            dropped_at: new Date()
        });

        res.json({ message: 'Student unenrolled successfully', enrollment });
    } catch (error) {
        console.error('Error unenrolling student:', error);
        res.status(500).json({ message: 'Failed to unenroll student' });
    }
};

/**
 * Bulk enroll from CSV data
 */
export const bulkEnrollFromCSV = async (req, res) => {
    try {
        const { enrollments } = req.body; // Array of { mahasiswa_npm, mata_kuliah_kode, semester, tahun_ajaran }

        if (!Array.isArray(enrollments)) {
            return res.status(400).json({ message: 'enrollments must be an array' });
        }

        const results = [];
        const errors = [];

        for (const record of enrollments) {
            try {
                const { mahasiswa_npm, mata_kuliah_kode, semester, tahun_ajaran } = record;

                // Find student by NPM
                const mahasiswa = await Mahasiswa.findOne({ where: { npm: mahasiswa_npm } });
                if (!mahasiswa) {
                    errors.push({ npm: mahasiswa_npm, error: 'Student not found' });
                    continue;
                }

                // Find course by kode_mk
                const mataKuliah = await MataKuliah.findOne({ where: { kode_mk: mata_kuliah_kode } });
                if (!mataKuliah) {
                    errors.push({ kode_mk: mata_kuliah_kode, error: 'Course not found' });
                    continue;
                }

                const [enrollment, created] = await Enrollment.findOrCreate({
                    where: {
                        mahasiswa_id: mahasiswa.id,
                        mata_kuliah_id: mataKuliah.id,
                        semester,
                        tahun_ajaran
                    },
                    defaults: {
                        status: 'Active',
                        enrolled_at: new Date()
                    }
                });

                results.push({
                    npm: mahasiswa_npm,
                    kode_mk: mata_kuliah_kode,
                    status: created ? 'enrolled' : 'already_enrolled'
                });
            } catch (err) {
                errors.push({ record, error: err.message });
            }
        }

        res.json({
            success: results.length,
            failed: errors.length,
            results,
            errors
        });
    } catch (error) {
        console.error('Error bulk enrolling:', error);
        res.status(500).json({ message: 'Failed to bulk enroll' });
    }
};

/**
 * Get enrollment statistics for a course
 */
export const getEnrollmentStats = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { semester, tahunAjaran } = req.query;

        const where = {
            mata_kuliah_id: courseId,
            semester: semester || 'Ganjil',
            tahun_ajaran: tahunAjaran || '2025/2026'
        };

        const total = await Enrollment.count({ where });
        const active = await Enrollment.count({ where: { ...where, status: 'Active' } });
        const dropped = await Enrollment.count({ where: { ...where, status: 'Dropped' } });
        const completed = await Enrollment.count({ where: { ...where, status: 'Completed' } });

        res.json({
            total,
            active,
            dropped,
            completed
        });
    } catch (error) {
        console.error('Error fetching enrollment stats:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};
