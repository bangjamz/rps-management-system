import { MataKuliah, DosenAssignment, User, Prodi, Fakultas, Institusi } from '../models/index.js';

import { Op } from 'sequelize';

// Get all mata kuliah
export const getAllCourses = async (req, res) => {
    try {
        const user = req.user;
        const { fakultasId, prodiId, semester } = req.query;

        console.log('DEBUG: getAllCourses', {
            role: user.role,
            userId: user.id,
            userProdi: user.prodi_id,
            querySem: semester,
            queryFak: fakultasId,
            queryProdi: prodiId
        });

        let whereClause = {};

        // 1. Role-based Base Access Control & Filtering
        // 1. Role-based Base Access Control & Filtering
        if (user.role === 'admin_institusi' || user.role === 'admin') {
            // Admin sees all, can filter by anything
            if (fakultasId) whereClause.fakultas_id = fakultasId;
            if (prodiId) whereClause.prodi_id = prodiId;

        } else if (user.role === 'dekan') {
            const userFakultasId = user.fakultas_id;
            if (prodiId) {
                whereClause.prodi_id = prodiId;
            } else {
                // Dekan sees courses in their faculty (both faculty-level and prodi-level)
                whereClause[Op.or] = [
                    { fakultas_id: userFakultasId },
                    { '$prodi.fakultas_id$': userFakultasId }
                ];
            }

        } else if (user.role === 'kaprodi') {
            // Kaprodi strictly sees their prodi
            whereClause.prodi_id = user.prodi_id;
        } else {
            // Dosen/Mahasiswa/Default
            const userFakultasId = user.fakultas_id || user.prodi?.fakultas_id;
            whereClause = {
                [Op.or]: [
                    { scope: 'institusi' },
                    ...(userFakultasId ? [{ fakultas_id: userFakultasId }] : []),
                    ...(user.prodi_id ? [{ prodi_id: user.prodi_id }] : [])
                ]
            };
        }

        // 2. Common Filter: Semester (ensure type safety)
        if (semester) {
            whereClause.semester = parseInt(semester);
        }

        // 3. Build Query Options
        const queryOptions = {
            where: whereClause,
            include: [
                {
                    model: DosenAssignment,
                    as: 'assignments',
                    where: { is_active: true },
                    required: false,
                    include: [{
                        model: User,
                        as: 'dosen',
                        attributes: ['id', 'nama_lengkap', 'nidn']
                    }]
                },
                {
                    model: Prodi,
                    as: 'prodi',
                    attributes: ['id', 'nama', 'fakultas_id'],
                    required: false
                },
                { model: Fakultas, as: 'fakultas', attributes: ['id', 'nama'], required: false },
                { model: Institusi, as: 'institusi', attributes: ['id', 'nama'], required: false }
            ],
            order: [['semester', 'ASC'], ['kode_mk', 'ASC']]
        };

        console.log('DEBUG: Course Query Options', JSON.stringify(queryOptions, null, 2));

        const courses = await MataKuliah.findAll(queryOptions);
        console.log(`DEBUG: Found ${courses.length} courses`);

        res.json(courses);
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get single course
export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await MataKuliah.findByPk(id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Create course
export const createCourse = async (req, res) => {
    try {
        const { kode_mk, nama_mk, sks, sks_teori, sks_praktek, semester, prodi_id } = req.body;

        // Auto-calculate Total SKS
        const totalSks = sks || (parseInt(sks_teori || 0) + parseInt(sks_praktek || 0));

        const course = await MataKuliah.create({
            kode_mk,
            nama_mk,
            sks: totalSks,
            sks_teori: sks_teori || 0,
            sks_praktek: sks_praktek || 0,
            semester,
            prodi_id: prodi_id || req.user.prodi_id
        });

        res.status(201).json(course);
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update course
export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { kode_mk, nama_mk, sks, sks_teori, sks_praktek, semester, scope, fakultas_id, prodi_id } = req.body;

        const course = await MataKuliah.findByPk(id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Auto-calculate Total SKS if not provided but Breakdown is
        const totalSks = sks || ((parseInt(sks_teori || 0) + parseInt(sks_praktek || 0)) || course.sks);

        await course.update({
            kode_mk,
            nama_mk,
            sks: totalSks,
            sks_teori: sks_teori !== undefined ? sks_teori : course.sks_teori,
            sks_praktek: sks_praktek !== undefined ? sks_praktek : course.sks_praktek,
            semester,
            scope,
            fakultas_id,
            prodi_id
        });

        res.json(course);
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete course
export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await MataKuliah.findByPk(id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        await course.destroy();

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
