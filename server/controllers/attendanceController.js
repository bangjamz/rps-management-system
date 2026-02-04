import {
    Attendance,
    RPSPertemuan,
    RPS,
    Mahasiswa,
    MataKuliah,
    User
} from '../models/index.js';

/**
 * Get attendance for a pertemuan
 */
export const getPertemuanAttendance = async (req, res) => {
    try {
        const { pertemuanId } = req.params;

        // Get pertemuan details
        const pertemuan = await RPSPertemuan.findByPk(pertemuanId, {
            include: [
                {
                    model: RPS,
                    as: 'rps',
                    include: [{ model: MataKuliah, as: 'mataKuliah' }]
                }
            ]
        });

        if (!pertemuan) {
            return res.status(404).json({ message: 'Pertemuan not found' });
        }

        // Get attendance records
        const attendance = await Attendance.findAll({
            where: { rps_pertemuan_id: pertemuanId },
            include: [
                {
                    model: Mahasiswa,
                    as: 'mahasiswa',
                    attributes: ['id', 'npm', 'nama']
                },
                {
                    model: User,
                    as: 'markedBy',
                    attributes: ['id', 'nama_lengkap']
                }
            ],
            order: [[{ model: Mahasiswa, as: 'mahasiswa' }, 'npm', 'ASC']]
        });

        // Calculate summary
        const summary = {
            total: attendance.length,
            hadir: attendance.filter(a => a.status === 'Hadir').length,
            izin: attendance.filter(a => a.status === 'Izin').length,
            sakit: attendance.filter(a => a.status === 'Sakit').length,
            alpa: attendance.filter(a => a.status === 'Alpa').length
        };

        res.json({
            pertemuan,
            attendance,
            summary
        });
    } catch (error) {
        console.error('Error fetching pertemuan attendance:', error);
        res.status(500).json({ message: 'Failed to fetch attendance' });
    }
};

/**
 * Mark single attendance
 */
export const markAttendance = async (req, res) => {
    try {
        const { mahasiswa_id, rps_pertemuan_id, status, notes } = req.body;

        if (!mahasiswa_id || !rps_pertemuan_id || !status) {
            return res.status(400).json({
                message: 'Required fields: mahasiswa_id, rps_pertemuan_id, status'
            });
        }

        const validStatuses = ['Hadir', 'Izin', 'Sakit', 'Alpa'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Upsert attendance
        const [attendance, created] = await Attendance.upsert({
            mahasiswa_id,
            rps_pertemuan_id,
            status,
            notes,
            marked_at: new Date(),
            marked_by: req.user.id
        }, {
            returning: true
        });

        res.json({
            message: created ? 'Attendance marked' : 'Attendance updated',
            attendance
        });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ message: 'Failed to mark attendance' });
    }
};

/**
 * Bulk mark attendance
 */
export const bulkMarkAttendance = async (req, res) => {
    try {
        const { rps_pertemuan_id, attendance } = req.body;

        if (!rps_pertemuan_id || !Array.isArray(attendance)) {
            return res.status(400).json({
                message: 'Required: rps_pertemuan_id, attendance (array)'
            });
        }

        const results = [];
        const errors = [];

        for (const record of attendance) {
            try {
                const { mahasiswa_id, status, notes } = record;

                if (!mahasiswa_id || !status) {
                    errors.push({ mahasiswa_id, error: 'Missing mahasiswa_id or status' });
                    continue;
                }

                await Attendance.upsert({
                    mahasiswa_id,
                    rps_pertemuan_id,
                    status,
                    notes,
                    marked_at: new Date(),
                    marked_by: req.user.id
                });

                results.push({ mahasiswa_id, status: 'success' });
            } catch (err) {
                errors.push({ mahasiswa_id: record.mahasiswa_id, error: err.message });
            }
        }

        res.json({
            success: results.length,
            failed: errors.length,
            results,
            errors
        });
    } catch (error) {
        console.error('Error bulk marking attendance:', error);
        res.status(500).json({ message: 'Failed to bulk mark attendance' });
    }
};

/**
 * Get student attendance report
 */
export const getStudentReport = async (req, res) => {
    try {
        const { mahasiswaId } = req.params;
        const { mataKuliahId, semester, tahunAjaran } = req.query;

        if (!mataKuliahId) {
            return res.status(400).json({ message: 'mataKuliahId is required' });
        }

        // Get student
        const mahasiswa = await Mahasiswa.findByPk(mahasiswaId);
        if (!mahasiswa) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Get course
        const mataKuliah = await MataKuliah.findByPk(mataKuliahId);

        // Get all pertemuan for this course
        const rps = await RPS.findOne({
            where: {
                mata_kuliah_id: mataKuliahId,
                semester: semester || 'Ganjil',
                tahun_ajaran: tahunAjaran || '2025/2026'
            }
        });

        if (!rps) {
            return res.status(404).json({ message: 'RPS not found for this course' });
        }

        const pertemuanList = await RPSPertemuan.findAll({
            where: { rps_id: rps.id },
            order: [['pertemuan_ke', 'ASC']]
        });

        // Get attendance records
        const pertemuanIds = pertemuanList.map(p => p.id);
        const attendanceRecords = await Attendance.findAll({
            where: {
                mahasiswa_id: mahasiswaId,
                rps_pertemuan_id: pertemuanIds
            }
        });

        // Build report
        const summary = {
            total_pertemuan: pertemuanList.length,
            hadir: attendanceRecords.filter(a => a.status === 'Hadir').length,
            izin: attendanceRecords.filter(a => a.status === 'Izin').length,
            sakit: attendanceRecords.filter(a => a.status === 'Sakit').length,
            alpa: attendanceRecords.filter(a => a.status === 'Alpa').length
        };

        // Calculate percentage (Hadir + Izin = acceptable presence)
        summary.percentage = pertemuanList.length > 0
            ? ((summary.hadir + summary.izin) / pertemuanList.length) * 100
            : 0;

        // Details
        const details = pertemuanList.map(p => {
            const record = attendanceRecords.find(a => a.rps_pertemuan_id === p.id);
            return {
                pertemuan_ke: p.pertemuan_ke,
                tanggal: p.tanggal,
                topik: p.topik,
                status: record ? record.status : null,
                notes: record ? record.notes : null
            };
        });

        res.json({
            mahasiswa: {
                id: mahasiswa.id,
                npm: mahasiswa.npm,
                nama: mahasiswa.nama
            },
            mataKuliah: {
                id: mataKuliah.id,
                kode_mk: mataKuliah.kode_mk,
                nama_mk: mataKuliah.nama_mk
            },
            summary,
            details
        });
    } catch (error) {
        console.error('Error fetching student report:', error);
        res.status(500).json({ message: 'Failed to fetch student report' });
    }
};

/**
 * Get course attendance report
 */
export const getCourseReport = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { semester, tahunAjaran } = req.query;

        // Get course
        const mataKuliah = await MataKuliah.findByPk(courseId);
        if (!mataKuliah) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Get RPS
        const rps = await RPS.findOne({
            where: {
                mata_kuliah_id: courseId,
                semester: semester || 'Ganjil',
                tahun_ajaran: tahunAjaran || '2025/2026'
            }
        });

        if (!rps) {
            return res.status(404).json({ message: 'RPS not found' });
        }

        // Get all pertemuan
        const pertemuanList = await RPSPertemuan.findAll({
            where: { rps_id: rps.id }
        });

        const totalPertemuan = pertemuanList.length;

        // Get all students (TODO: from enrollment, for now use mock/all from prodi)
        const students = await Mahasiswa.findAll({
            where: { prodi_id: mataKuliah.prodi_id },
            limit: 50 // Limit for demo
        });

        // Get all attendance for this RPS
        const pertemuanIds = pertemuanList.map(p => p.id);
        const allAttendance = await Attendance.findAll({
            where: {
                rps_pertemuan_id: pertemuanIds
            }
        });

        // Build student summary
        const studentSummaries = students.map(student => {
            const studentAttendance = allAttendance.filter(a => a.mahasiswa_id === student.id);

            const summary = {
                mahasiswa_id: student.id,
                npm: student.npm,
                nama: student.nama,
                hadir: studentAttendance.filter(a => a.status === 'Hadir').length,
                izin: studentAttendance.filter(a => a.status === 'Izin').length,
                sakit: studentAttendance.filter(a => a.status === 'Sakit').length,
                alpa: studentAttendance.filter(a => a.status === 'Alpa').length
            };

            summary.percentage = totalPertemuan > 0
                ? ((summary.hadir + summary.izin) / totalPertemuan) * 100
                : 0;

            return summary;
        });

        // Calculate class average
        const classAverage = studentSummaries.length > 0
            ? studentSummaries.reduce((sum, s) => sum + s.percentage, 0) / studentSummaries.length
            : 0;

        res.json({
            course: {
                id: mataKuliah.id,
                kode_mk: mataKuliah.kode_mk,
                nama_mk: mataKuliah.nama_mk
            },
            total_pertemuan: totalPertemuan,
            students: studentSummaries,
            class_average: classAverage.toFixed(2)
        });
    } catch (error) {
        console.error('Error fetching course report:', error);
        res.status(500).json({ message: 'Failed to fetch course report' });
    }
};
