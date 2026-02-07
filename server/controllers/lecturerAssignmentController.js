import { DosenAssignment, User, MataKuliah, Prodi, Fakultas, Notification } from '../models/index.js';
import { ROLES } from '../middleware/auth.js';

/**
 * Get all lecturer assignments (filtered by user role)
 * GET /api/lecturer-assignments
 */
// Get all lecturer assignments (filtered by user role)
export const getAllAssignments = async (req, res) => {
    try {
        const user = req.user;
        const { semester, tahunAjaran, prodiId } = req.query;

        let whereClause = { is_active: true };
        let mataKuliahWhere = {};

        // Filter by semester/tahun if provided
        if (semester) whereClause.semester = semester;
        if (tahunAjaran) whereClause.tahun_ajaran = tahunAjaran;

        // Role-based filtering
        if (user.role === ROLES.ADMIN_INSTITUSI) {
            // Admin sees all, filter by prodi if provided
            if (prodiId) mataKuliahWhere.prodi_id = prodiId;
        } else if (user.role === ROLES.DEKAN) {
            // Dekan sees all assignments in their fakultas
            // If prodiId filtered, ensure it belongs to their fakultas (or relies on DB association check)
            if (prodiId) {
                // Ideally verify prodi belongs to fakultas, but for list view we can trust ID + Association override
                mataKuliahWhere.prodi_id = prodiId;
            }
            // We enforce Fakultas scope in the Include
        } else if (user.role === ROLES.KAPRODI) {
            // Kaprodi sees assignments for their prodi courses
            mataKuliahWhere.prodi_id = user.prodi_id;
        } else if (user.role === ROLES.DOSEN) {
            // Dosen sees only their own assignments
            whereClause.dosen_id = user.id;
        }

        const assignments = await DosenAssignment.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'dosen',
                    attributes: ['id', 'nama_lengkap', 'email', 'nidn', 'prodi_id'],
                    include: [
                        {
                            model: Prodi,
                            as: 'prodi',
                            attributes: ['id', 'kode', 'nama'],
                            include: [{
                                model: Fakultas,
                                as: 'fakultas',
                                attributes: ['id', 'kode', 'nama']
                            }]
                        }
                    ]
                },
                {
                    model: MataKuliah,
                    as: 'mata_kuliah',
                    where: Object.keys(mataKuliahWhere).length > 0 ? mataKuliahWhere : undefined,
                    attributes: ['id', 'kode_mk', 'nama_mk', 'sks', 'semester', 'prodi_id'],
                    include: [{
                        model: Prodi,
                        as: 'prodi',
                        attributes: ['id', 'kode', 'nama', 'fakultas_id'],
                        // Enforce Fakultas Scope for Dekan
                        where: user.role === ROLES.DEKAN && !prodiId ? { fakultas_id: user.fakultas_id } : undefined
                    }]
                },
                {
                    model: User,
                    as: 'assigner',
                    attributes: ['id', 'nama_lengkap']
                }
            ],
            order: [['tahun_ajaran', 'DESC'], ['semester', 'DESC'], ['created_at', 'DESC']]
        });

        res.json(assignments);
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ message: 'Failed to retrieve lecturer assignments' });
    }
};

/**
 * Get available lecturers for assignment (supports cross-faculty)
 * GET /api/lecturer-assignments/available-lecturers?prodiId=X
 */
export const getAvailableLecturers = async (req, res) => {
    try {
        const { prodiId } = req.query;

        // Get all active lecturers with their homebase prodi/fakultas info
        const lecturers = await User.findAll({
            where: { role: ROLES.DOSEN, is_active: true },
            attributes: ['id', 'nama_lengkap', 'email', 'nidn', 'telepon', 'prodi_id'],
            include: [
                {
                    model: Prodi,
                    as: 'prodi',
                    attributes: ['id', 'kode', 'nama', 'fakultas_id'],
                    include: [{
                        model: Fakultas,
                        as: 'fakultas',
                        attributes: ['id', 'kode', 'nama']
                    }]
                }
            ],
            order: [['nama_lengkap', 'ASC']]
        });

        // If no prodiId provided or invalid, return all as cross-faculty
        if (!prodiId || isNaN(parseInt(prodiId))) {
            const categorized = lecturers.map(lecturer => ({
                ...lecturer.toJSON(),
                assignmentCategory: 'cross-faculty',
                isSameProdi: false,
                isSameFakultas: false
            }));

            return res.json({
                targetProdi: null,
                lecturers: categorized
            });
        }

        // Categorize lecturers based on target Prodi
        const targetProdi = await Prodi.findByPk(prodiId, {
            include: [{ model: Fakultas, as: 'fakultas' }]
        });

        if (!targetProdi) {
            // Fallback if prodiId provided but not found (e.g. partial data)
            const categorized = lecturers.map(lecturer => ({
                ...lecturer.toJSON(),
                assignmentCategory: 'cross-faculty',
                isSameProdi: false,
                isSameFakultas: false
            }));

            return res.json({
                targetProdi: null,
                lecturers: categorized
            });
        }

        const categorized = lecturers.map(lecturer => {
            const lecData = lecturer.toJSON();
            let category = 'cross-faculty';
            let isSameProdi = false;
            let isSameFakultas = false;

            if (lecturer.prodi_id === parseInt(prodiId)) {
                category = 'same-prodi';
                isSameProdi = true;
                isSameFakultas = true;
            } else if (lecturer.prodi?.fakultas_id === targetProdi.fakultas_id) {
                category = 'same-fakultas';
                isSameFakultas = true;
            }

            return {
                ...lecData,
                assignmentCategory: category,
                isSameProdi,
                isSameFakultas
            };
        });

        // Sort by category priority: same-prodi > same-fakultas > cross-faculty
        const sorted = categorized.sort((a, b) => {
            const priority = { 'same-prodi': 0, 'same-fakultas': 1, 'cross-faculty': 2 };
            return priority[a.assignmentCategory] - priority[b.assignmentCategory];
        });

        res.json({
            targetProdi: {
                id: targetProdi.id,
                nama: targetProdi.nama,
                fakultas: targetProdi.fakultas.nama
            },
            lecturers: sorted
        });
    } catch (error) {
        console.error('Get available lecturers error:', error);
        res.status(500).json({ message: 'Failed to retrieve available lecturers' });
    }
};

/**
 * Create new lecturer assignment
 * POST /api/lecturer-assignments
 */
export const createAssignment = async (req, res) => {
    try {
        const { dosen_id, mata_kuliah_id, semester, tahun_ajaran, catatan, force } = req.body;
        const user = req.user;

        // Validation
        if (!dosen_id || !mata_kuliah_id || !semester || !tahun_ajaran) {
            return res.status(400).json({
                message: 'dosen_id, mata_kuliah_id, semester, and tahun_ajaran are required'
            });
        }

        // Normalize dosen_id to array for consistent handling (Team Teaching support)
        const dosenIds = Array.isArray(dosen_id) ? dosen_id : [dosen_id];

        if (dosenIds.length === 0) {
            return res.status(400).json({ message: 'At least one dosen_id is required' });
        }

        // Verify mata kuliah exists and user has permission
        const mataKuliah = await MataKuliah.findByPk(mata_kuliah_id);
        if (!mataKuliah) {
            return res.status(404).json({ message: 'Mata kuliah not found' });
        }

        // Check authorization
        if (user.role === ROLES.KAPRODI && mataKuliah.prodi_id !== user.prodi_id) {
            return res.status(403).json({ message: 'You can only assign lecturers to your own prodi courses' });
        }

        // Check for existing assignments in same semester/tahun
        const existingAssignments = await DosenAssignment.findAll({
            where: {
                mata_kuliah_id,
                semester,
                tahun_ajaran,
                is_active: true
            },
            include: [{ model: User, as: 'dosen' }]
        });

        if (existingAssignments.length > 0) {
            if (!force) {
                return res.status(409).json({
                    message: 'Mata kuliah ini sudah memiliki penugasan aktif.',
                    existing: existingAssignments[0] // Return first for backward compatibility in UI check
                });
            } else {
                // Deactivate ALL existing assignments for this course/sem/year
                for (const existing of existingAssignments) {
                    existing.is_active = false;
                    await existing.save();

                    // Notify replaced lecturers
                    try {
                        await Notification.create({
                            user_id: existing.dosen_id,
                            title: 'Perubahan Penugasan Mengajar',
                            message: `Penugasan Anda untuk mata kuliah ${mataKuliah.kode_mk} - ${mataKuliah.nama_mk} (Sem ${semester} ${tahun_ajaran}) telah diperbarui oleh Kaprodi.`,
                            type: 'warning'
                        });
                    } catch (notifWarn) {
                        console.error('Failed to notify replaced lecturer:', notifWarn);
                    }
                }
            }
        }

        const createdAssignments = [];

        // Create assignments for all selected lecturers
        // Create assignments for all selected lecturers
        for (const dId of dosenIds) {
            // Verify each dosen exists
            const dosen = await User.findByPk(dId);
            if (!dosen || dosen.role !== ROLES.DOSEN || !dosen.is_active) {
                console.warn(`Skipping invalid or inactive dosen ID: ${dId}`);
                continue;
            }

            // Create or Reactivate assignment (to handle Unique Constraint on inactive rows)
            const [assignment, created] = await DosenAssignment.findOrCreate({
                where: {
                    dosen_id: dId,
                    mata_kuliah_id,
                    semester,
                    tahun_ajaran
                },
                defaults: {
                    assigned_by: user.id,
                    catatan: dosenIds.length > 1 ? `Team Teaching. ${catatan || ''}` : catatan,
                    is_active: true
                }
            });

            if (!created) {
                // If it existed (active or inactive), update it
                assignment.is_active = true;
                assignment.catatan = dosenIds.length > 1 ? `Team Teaching. ${catatan || ''}` : catatan;
                assignment.assigned_by = user.id; // Update who re-assigned it
                await assignment.save();
            }

            // Notify the new lecturer (only if newly active or created)
            if (created || !assignment.is_active) {
                try {
                    await Notification.create({
                        user_id: dId,
                        title: 'Penugasan Mengajar Baru',
                        message: `Anda telah ditugaskan untuk mengampu mata kuliah ${mataKuliah.kode_mk} - ${mataKuliah.nama_mk} ${dosenIds.length > 1 ? '(Team Teaching) ' : ''}pada Semester ${semester} ${tahun_ajaran}.`,
                        type: 'success',
                        link: '/dosen/courses'
                    });
                } catch (notifErr) {
                    console.error('Failed to notify new lecturer:', notifErr);
                }
            }

            createdAssignments.push(assignment);
        }

        if (createdAssignments.length === 0) {
            return res.status(400).json({ message: 'No valid lecturers were assigned' });
        }

        // Fetch latest data for response
        const firstAssignment = await DosenAssignment.findByPk(createdAssignments[0].id, {
            include: [
                {
                    model: User,
                    as: 'dosen',
                    attributes: ['id', 'nama_lengkap', 'email', 'nidn'],
                    include: [{
                        model: Prodi,
                        as: 'prodi',
                        attributes: ['id', 'kode', 'nama']
                    }]
                },
                {
                    model: MataKuliah,
                    as: 'mata_kuliah',
                    attributes: ['id', 'kode_mk', 'nama_mk', 'sks']
                }
            ]
        });

        res.status(201).json({
            message: `Berhasil menugaskan ${createdAssignments.length} dosen`,
            assignment: firstAssignment,
            count: createdAssignments.length
        });
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ message: 'Failed to create lecturer assignment' });
    }
};

/**
 * Update lecturer assignment
 * PUT /api/lecturer-assignments/:id
 */
export const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { dosen_id, catatan, is_active } = req.body;
        const user = req.user;

        const assignment = await DosenAssignment.findByPk(id, {
            include: [{ model: MataKuliah, as: 'mata_kuliah' }]
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check authorization
        if (user.role === ROLES.KAPRODI && assignment.mata_kuliah.prodi_id !== user.prodi_id) {
            return res.status(403).json({ message: 'You can only update assignments for your own prodi courses' });
        }

        // Update allowed fields
        if (dosen_id !== undefined) {
            const dosen = await User.findByPk(dosen_id);
            if (!dosen || dosen.role !== ROLES.DOSEN) {
                return res.status(404).json({ message: 'Invalid dosen' });
            }
            assignment.dosen_id = dosen_id;
        }
        if (catatan !== undefined) assignment.catatan = catatan;
        if (is_active !== undefined) assignment.is_active = is_active;

        await assignment.save();

        // Fetch updated assignment with includes
        const updated = await DosenAssignment.findByPk(id, {
            include: [
                { model: User, as: 'dosen', attributes: ['id', 'nama_lengkap', 'email'] },
                { model: MataKuliah, as: 'mata_kuliah', attributes: ['id', 'kode_mk', 'nama_mk'] },
                { model: User, as: 'assigner', attributes: ['id', 'nama_lengkap'] }
            ]
        });

        res.json(updated);
    } catch (error) {
        console.error('Update assignment error:', error);
        res.status(500).json({ message: 'Failed to update lecturer assignment' });
    }
};

/**
 * Delete (deactivate) lecturer assignment
 * DELETE /api/lecturer-assignments/:id
 */
export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const assignment = await DosenAssignment.findByPk(id, {
            include: [{ model: MataKuliah, as: 'mata_kuliah' }]
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Check authorization
        if (user.role === ROLES.KAPRODI && assignment.mata_kuliah.prodi_id !== user.prodi_id) {
            return res.status(403).json({ message: 'You can only delete assignments for your own prodi courses' });
        }

        // Soft delete by setting is_active = false
        assignment.is_active = false;
        await assignment.save();

        res.json({ message: 'Assignment deleted successfully', id: assignment.id });
    } catch (error) {
        console.error('Delete assignment error:', error);
        res.status(500).json({ message: 'Failed to delete lecturer assignment' });
    }
};

/**
 * Update dosen (lecturer) data
 * PUT /api/lecturer-assignments/dosen/:id
 */
export const updateDosen = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_lengkap, nidn, email, status } = req.body;
        const user = req.user;

        const dosen = await User.findOne({
            where: { id, role: ROLES.DOSEN }
        });

        if (!dosen) {
            return res.status(404).json({ message: 'Dosen not found' });
        }

        // Check authorization - kaprodi can only edit dosen in their prodi
        if (user.role === ROLES.KAPRODI && dosen.prodi_id !== user.prodi_id) {
            return res.status(403).json({ message: 'You can only edit lecturers from your own prodi' });
        }

        // Update fields
        if (nama_lengkap) dosen.nama_lengkap = nama_lengkap;
        if (nidn !== undefined) dosen.nidn = nidn;
        if (email) dosen.email = email;
        if (status) dosen.is_active = status === 'Aktif';

        await dosen.save();

        res.json({
            message: 'Dosen berhasil diperbarui',
            dosen: {
                id: dosen.id,
                nama_lengkap: dosen.nama_lengkap,
                nidn: dosen.nidn,
                email: dosen.email,
                status: dosen.is_active ? 'Aktif' : 'Tidak Aktif'
            }
        });
    } catch (error) {
        console.error('Update dosen error:', error);
        res.status(500).json({ message: 'Failed to update dosen' });
    }
};

/**
 * Create new dosen (lecturer)
 * POST /api/lecturer-assignments/dosen
 */
export const createDosen = async (req, res) => {
    try {
        const { nama_lengkap, nidn, email, status } = req.body;
        const user = req.user;

        if (!nama_lengkap) {
            return res.status(400).json({ message: 'Nama lengkap is required' });
        }

        // Check if email or nidn already exists
        if (email) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email sudah terdaftar' });
            }
        }

        if (nidn) {
            const existingNidn = await User.findOne({ where: { nidn } });
            if (existingNidn) {
                return res.status(400).json({ message: 'NIDN sudah terdaftar' });
            }
        }

        // Create new dosen with kaprodi's prodi_id
        // Generate username from email prefix or random string
        let baseUsername = email ? email.split('@')[0] : nama_lengkap.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-0_]/g, '');
        let username = baseUsername;
        let counter = 1;

        // Ensure username is unique
        while (await User.findOne({ where: { username } })) {
            username = `${baseUsername}${counter}`;
            counter++;
        }

        const newDosen = await User.create({
            username,
            nama_lengkap,
            nidn: nidn || null,
            email: email || `dosen_${Date.now()}@temp.local`,
            password_hash: '$2b$10$defaulthashedpassword', // Placeholder password (matching model field)
            role: ROLES.DOSEN,
            prodi_id: user.prodi_id, // Assign to kaprodi's prodi
            is_active: status !== 'Keluar'
        });

        res.status(201).json({
            message: 'Dosen baru berhasil ditambahkan',
            dosen: {
                id: newDosen.id,
                nama_lengkap: newDosen.nama_lengkap,
                nidn: newDosen.nidn,
                email: newDosen.email,
                status: newDosen.is_active ? 'Aktif' : 'Tidak Aktif'
            }
        });
    } catch (error) {
        console.error('Create dosen error:', error);
        res.status(500).json({ message: 'Failed to create dosen' });
    }
};


/**
 * Delete (deactivate) dosen
 * DELETE /api/lecturer-assignments/dosen/:id
 */
export const deleteDosen = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const dosen = await User.findOne({
            where: { id, role: ROLES.DOSEN }
        });

        if (!dosen) {
            return res.status(404).json({ message: 'Dosen not found' });
        }

        // Check authorization - kaprodi can only delete dosen in their prodi
        if (user.role === ROLES.KAPRODI && dosen.prodi_id !== user.prodi_id) {
            return res.status(403).json({ message: 'You can only delete lecturers from your own prodi' });
        }

        // Soft delete
        dosen.is_active = false;
        await dosen.save();

        res.json({ message: 'Dosen berhasil dinonaktifkan', id: dosen.id });
    } catch (error) {
        console.error('Delete dosen error:', error);
        res.status(500).json({ message: 'Failed to delete dosen' });
    }
};
