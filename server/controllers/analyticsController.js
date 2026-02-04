import {
    StudentGrade,
    FinalGrade,
    Attendance,
    Mahasiswa,
    MataKuliah,
    RPSPertemuan,
    RPS,
    Prodi,
    Dosen,
    Enrollment
} from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Get grade distribution for a course
 */
export const getGradeDistribution = async (req, res) => {
    try {
        const { mata_kuliah_id, semester, tahun_ajaran } = req.query;

        if (!mata_kuliah_id || !semester || !tahun_ajaran) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const grades = await FinalGrade.findAll({
            where: {
                mata_kuliah_id,
                semester,
                tahun_ajaran,
                status: 'Approved'
            },
            attributes: [
                'nilai_huruf',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['nilai_huruf'],
            raw: true
        });

        // Format for chart
        const distribution = grades.map(g => ({
            grade: g.nilai_huruf,
            count: parseInt(g.count)
        }));

        res.json(distribution);
    } catch (error) {
        console.error('Error fetching grade distribution:', error);
        res.status(500).json({ message: 'Failed to fetch grade distribution' });
    }
};

/**
 * Get attendance trends over time
 */
export const getAttendanceTrends = async (req, res) => {
    try {
        const { mata_kuliah_id, semester, tahun_ajaran } = req.query;

        if (!mata_kuliah_id || !semester || !tahun_ajaran) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Get RPS for this course
        const rps = await RPS.findOne({
            where: { mata_kuliah_id, semester, tahun_ajaran }
        });

        if (!rps) {
            return res.json([]);
        }

        // Get attendance per pertemuan
        const trends = await Attendance.findAll({
            include: [
                {
                    model: RPSPertemuan,
                    as: 'rpsPertemuan',
                    where: { rps_id: rps.id },
                    attributes: ['pertemuan_ke', 'tanggal', 'topik']
                }
            ],
            attributes: [
                [sequelize.col('rpsPertemuan.pertemuan_ke'), 'week'],
                [sequelize.col('rpsPertemuan.tanggal'), 'date'],
                'status',
                [sequelize.fn('COUNT', sequelize.col('Attendance.id')), 'count']
            ],
            group: ['rpsPertemuan.pertemuan_ke', 'rpsPertemuan.tanggal', 'status'],
            order: [[sequelize.col('rpsPertemuan.pertemuan_ke'), 'ASC']],
            raw: true
        });

        // Group by week
        const weekMap = {};
        trends.forEach(t => {
            const week = t.week;
            if (!weekMap[week]) {
                weekMap[week] = {
                    week,
                    date: t.date,
                    Hadir: 0,
                    Izin: 0,
                    Sakit: 0,
                    Alpa: 0
                };
            }
            weekMap[week][t.status] = parseInt(t.count);
        });

        const result = Object.values(weekMap).sort((a, b) => a.week - b.week);
        res.json(result);
    } catch (error) {
        console.error('Error fetching attendance trends:', error);
        res.status(500).json({ message: 'Failed to fetch attendance trends' });
    }
};

/**
 * Get CPL attainment summary for a prodi
 */
export const getCPLAttainment = async (req, res) => {
    try {
        const { prodi_id, tahun_ajaran } = req.query;

        if (!prodi_id || !tahun_ajaran) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // TODO: Implement CPL calculation algorithm
        // For now, return mock data
        const mockData = [
            { cpl: 'CPL-1', attainment: 85.5 },
            { cpl: 'CPL-2', attainment: 78.3 },
            { cpl: 'CPL-3', attainment: 92.1 },
            { cpl: 'CPL-4', attainment: 81.7 },
            { cpl: 'CPL-5', attainment: 88.9 }
        ];

        res.json(mockData);
    } catch (error) {
        console.error('Error fetching CPL attainment:', error);
        res.status(500).json({ message: 'Failed to fetch CPL attainment' });
    }
};

/**
 * Get dashboard summary stats
 */
export const getDashboardStats = async (req, res) => {
    try {
        const { role, user } = req.user;

        let stats = {};

        if (role === 'Kaprodi') {
            // Get prodi stats
            const prodiId = user.kaprodi?.prodi_id;

            const totalStudents = await Mahasiswa.count({ where: { prodi_id: prodiId } });
            const totalDosen = await Dosen.count({ where: { prodi_id: prodiId } });
            const totalCourses = await MataKuliah.count({ where: { prodi_id: prodiId } });
            const activeRPS = await RPS.count({
                where: { status: 'Approved' },
                include: [{
                    model: MataKuliah,
                    as: 'mataKuliah',
                    where: { prodi_id: prodiId }
                }]
            });

            stats = {
                totalStudents,
                totalDosen,
                totalCourses,
                activeRPS
            };
        } else if (role === 'Dosen') {
            // Get dosen stats
            const dosenId = user.dosen?.id;

            const totalCourses = await RPS.count({ where: { dosen_pengampu_id: dosenId } });
            const activeRPS = await RPS.count({
                where: {
                    dosen_pengampu_id: dosenId,
                    status: 'Approved'
                }
            });
            const draftRPS = await RPS.count({
                where: {
                    dosen_pengampu_id: dosenId,
                    status: 'Draft'
                }
            });
            const totalStudents = await Enrollment.count({
                where: { status: 'Active' },
                include: [{
                    model: MataKuliah,
                    as: 'mataKuliah',
                    include: [{
                        model: RPS,
                        as: 'rps',
                        where: { dosen_pengampu_id: dosenId }
                    }]
                }]
            });

            stats = {
                totalCourses,
                activeRPS,
                draftRPS,
                totalStudents
            };
        }

        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
};

/**
 * Get course list for analytics dropdown
 */
export const getCoursesForAnalytics = async (req, res) => {
    try {
        const { role, user } = req.user;

        let courses = [];

        if (role === 'Kaprodi') {
            const prodiId = user.kaprodi?.prodi_id;
            courses = await MataKuliah.findAll({
                where: { prodi_id: prodiId },
                order: [['kode_mk', 'ASC']]
            });
        } else if (role === 'Dosen') {
            const dosenId = user.dosen?.id;
            const rps = await RPS.findAll({
                where: { dosen_pengampu_id: dosenId },
                include: [{
                    model: MataKuliah,
                    as: 'mataKuliah'
                }]
            });
            courses = rps.map(r => r.mataKuliah);
        }

        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses for analytics:', error);
        res.status(500).json({ message: 'Failed to fetch courses' });
    }
};
