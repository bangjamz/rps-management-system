import { RPS, RPSPertemuan, MataKuliah, User, DosenAssignment, Prodi, CPL, CPMK, Fakultas } from '../models/index.js';
import { ROLES } from '../middleware/auth.js';

/**
 * Get all RPS (filtered by user role)
 * GET /api/rps
 */
export const getAllRPS = async (req, res) => {
    try {
        const user = req.user;
        const { status, prodiId, semester, tahunAjaran } = req.query;

        let whereClause = {};
        let mataKuliahWhere = {};

        // Filter by status if provided
        if (status) whereClause.status = status;
        if (semester) whereClause.semester = semester;
        if (tahunAjaran) whereClause.tahun_ajaran = tahunAjaran;

        // Role-based filtering
        if (user.role === ROLES.DOSEN) {
            // Dosen sees only their own RPS
            whereClause.dosen_id = user.id;
        } else if (user.role === ROLES.KAPRODI) {
            // Kaprodi sees RPS for their prodi courses
            mataKuliahWhere.prodi_id = user.prodi_id;
        } else if (user.role === ROLES.DEKAN) {
            // Dekan sees RPS for all courses in their fakultas
            const prodiList = await Prodi.findAll({
                where: { fakultas_id: user.fakultas_id, is_active: true },
                attributes: ['id']
            });
            mataKuliahWhere.prodi_id = prodiList.map(p => p.id);
        }

        // Optional prodi filter for admin/dekan
        if (prodiId && [ROLES.ADMIN_INSTITUSI, ROLES.DEKAN].includes(user.role)) {
            mataKuliahWhere.prodi_id = parseInt(prodiId);
        }

        const rpsList = await RPS.findAll({
            where: whereClause,
            include: [
                {
                    model: MataKuliah,
                    as: 'mata_kuliah',
                    where: Object.keys(mataKuliahWhere).length > 0 ? mataKuliahWhere : undefined,
                    attributes: ['id', 'kode_mk', 'nama_mk', 'sks', 'semester'],
                    include: [{
                        model: Prodi,
                        as: 'prodi',
                        attributes: ['id', 'kode', 'nama']
                    }]
                },
                {
                    model: User,
                    as: 'dosen',
                    attributes: ['id', 'nama_lengkap', 'email', 'nidn']
                },
                {
                    model: User,
                    as: 'approver',
                    attributes: ['id', 'nama_lengkap'],
                    required: false
                },
                {
                    model: DosenAssignment,
                    as: 'assignment',
                    attributes: ['id', 'semester', 'tahun_ajaran'],
                    required: false
                }
            ],
            order: [['updated_at', 'DESC']]
        });

        res.json(rpsList);
    } catch (error) {
        console.error('Get all RPS error:', error);
        res.status(500).json({ message: 'Failed to retrieve RPS data' });
    }
};

/**
 * Get RPS by Course ID (Latest)
 * GET /api/rps/by-course/:courseId
 * Returns the latest RPS for a given course (if exists)
 */
export const getRPSByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Find the most recent RPS for this course
        const rps = await RPS.findOne({
            where: { mata_kuliah_id: courseId },
            include: [
                {
                    model: MataKuliah,
                    as: 'mata_kuliah',
                    attributes: ['id', 'kode_mk', 'nama_mk', 'sks'],
                    include: [{
                        model: Prodi,
                        as: 'prodi',
                        include: [{
                            model: Fakultas,
                            as: 'fakultas',
                            attributes: ['id', 'nama']
                        }]
                    }]
                },
                {
                    model: User,
                    as: 'dosen',
                    attributes: ['id', 'nama_lengkap']
                },
                {
                    model: RPSPertemuan,
                    as: 'pertemuan',
                    separate: true,
                    order: [['minggu_ke', 'ASC']]
                }
            ],
            order: [['created_at', 'DESC']]  // Get the most recent one
        });

        if (!rps) {
            return res.status(404).json({ message: 'No RPS found for this course' });
        }

        const rpsWithInclusions = await resolveRPSInclusions(rps);

        res.json(rpsWithInclusions);
    } catch (error) {
        console.error('Get RPS by course error:', error);
        res.status(500).json({ message: 'Failed to retrieve RPS for course' });
    }
};

/**
 * Get all RPS versions for a course
 * GET /api/rps/versions/:courseId
 */
export const getVersionsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const versions = await RPS.findAll({
            where: { mata_kuliah_id: courseId },
            attributes: ['id', 'status', 'revision', 'updated_at', 'is_template', 'semester', 'tahun_ajaran'],
            include: [
                {
                    model: User,
                    as: 'dosen',
                    attributes: ['id', 'nama_lengkap']
                },
                {
                    model: User,
                    as: 'approver',
                    attributes: ['id', 'nama_lengkap']
                }
            ],
            order: [
                ['is_template', 'DESC'], // Templates first
                ['revision', 'DESC'],    // Latest revision first
                ['updated_at', 'DESC']
            ]
        });

        res.json(versions);
    } catch (error) {
        console.error('Get RPS versions error:', error);
        res.status(500).json({ message: 'Failed to retrieve RPS versions' });
    }
};

/**
 * Get RPS by ID with full details
 * GET /api/rps/:id
 */
export const getRPSById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const rps = await RPS.findByPk(id, {
            include: [
                {
                    model: MataKuliah,
                    as: 'mata_kuliah',
                    include: [{
                        model: Prodi,
                        as: 'prodi',
                        include: [{
                            model: Fakultas,
                            as: 'fakultas',
                            attributes: ['id', 'nama']
                        }]
                    }]
                },
                {
                    model: User,
                    as: 'dosen',
                    attributes: ['id', 'nama_lengkap', 'email', 'nidn']
                },
                {
                    model: User,
                    as: 'approver',
                    attributes: ['id', 'nama_lengkap', 'email'],
                    required: false
                },
                {
                    model: DosenAssignment,
                    as: 'assignment',
                    required: false
                },
                {
                    model: RPS,
                    as: 'template',
                    attributes: ['id', 'mata_kuliah_id', 'is_template'],
                    required: false
                },
                {
                    model: RPSPertemuan,
                    as: 'pertemuan',
                    separate: true,
                    order: [['minggu_ke', 'ASC']]
                }
            ]
        });

        if (!rps) {
            return res.status(404).json({ message: 'RPS not found' });
        }

        // Authorization check
        const canAccess = await canUserAccessRPS(user, rps);
        if (!canAccess) {
            return res.status(403).json({ message: 'Access denied to this RPS' });
        }

        const rpsWithInclusions = await resolveRPSInclusions(rps);

        res.json(rpsWithInclusions);
    } catch (error) {
        console.error('Get RPS by ID error:', error);
        res.status(500).json({ message: 'Failed to retrieve RPS details' });
    }
};

/**
 * Create new RPS
 * POST /api/rps
 */
export const createRPS = async (req, res) => {
    try {
        const user = req.user;
        const {
            mata_kuliah_id,
            assignment_id,
            is_template,
            template_id,
            semester,
            tahun_ajaran,
            deskripsi_mk,
            capaian_pembelajaran,
            prasyarat
        } = req.body;

        // Validation
        if (!mata_kuliah_id) {
            return res.status(400).json({ message: 'mata_kuliah_id is required' });
        }

        if (!is_template && (!semester || !tahun_ajaran)) {
            return res.status(400).json({ message: 'semester and tahun_ajaran required for RPS instances' });
        }

        // Verify mata kuliah exists
        const mataKuliah = await MataKuliah.findByPk(mata_kuliah_id, {
            include: [{ model: Prodi, as: 'prodi' }]
        });

        if (!mataKuliah) {
            return res.status(404).json({ message: 'Mata kuliah not found' });
        }

        // Authorization
        if (user.role === ROLES.KAPRODI && is_template) {
            // Kaprodi can create templates for their prodi
            if (mataKuliah.prodi_id !== user.prodi_id) {
                return res.status(403).json({ message: 'Can only create templates for your prodi courses' });
            }
        } else if (user.role === ROLES.DOSEN && !is_template) {
            // Dosen can create instances (must have assignment)
            if (!assignment_id) {
                return res.status(400).json({ message: 'assignment_id required for dosen RPS instances' });
            }

            const assignment = await DosenAssignment.findByPk(assignment_id);
            if (!assignment || assignment.dosen_id !== user.id) {
                return res.status(403).json({ message: 'Invalid assignment or not assigned to you' });
            }
        } else {
            return res.status(403).json({ message: 'Insufficient permissions to create RPS' });
        }

        // Create RPS
        const rps = await RPS.create({
            mata_kuliah_id,
            assignment_id: is_template ? null : assignment_id,
            dosen_id: user.id,
            is_template: is_template || false,
            template_id,
            semester: is_template ? null : semester,
            tahun_ajaran: is_template ? null : tahun_ajaran,
            semester_akademik: is_template ? null : `${tahun_ajaran} ${semester}`,
            deskripsi_mk,
            capaian_pembelajaran,
            prasyarat,
            cpl_ids: req.body.cpl_ids || [],
            cpmk_ids: req.body.cpmk_ids || [],
            status: 'draft'
        });

        // Fetch full RPS
        const fullRPS = await RPS.findByPk(rps.id, {
            include: [
                { model: MataKuliah, as: 'mata_kuliah' },
                { model: User, as: 'dosen', attributes: ['id', 'nama_lengkap', 'email'] }
            ]
        });

        const rpsWithInclusions = await resolveRPSInclusions(fullRPS);

        res.status(201).json(rpsWithInclusions);
    } catch (error) {
        console.error('Create RPS error:', error);
        res.status(500).json({ message: 'Failed to create RPS' });
    }
};

/**
 * Helper to resolve JSON IDs to full objects
 * @param {Object} rps - The RPS instance
 * @returns {Object} - RPS with included objects
 */
const resolveRPSInclusions = async (rps) => {
    if (!rps) return rps;

    const rpsJson = rps.toJSON ? rps.toJSON() : rps;

    // Helper to ensure we have an array of IDs
    const ensureArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
            try {
                const parsed = JSON.parse(val);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    };

    const cplIds = ensureArray(rpsJson.cpl_ids);
    const cpmkIds = ensureArray(rpsJson.cpmk_ids);

    // Resolve CPLs
    if (cplIds.length > 0) {
        try {
            rpsJson.cpl = await CPL.findAll({
                where: { id: cplIds },
                attributes: ['id', 'kode_cpl', 'deskripsi']
            });
        } catch (e) {
            console.error('Error resolving CPLs:', e);
            rpsJson.cpl = [];
        }
    } else {
        rpsJson.cpl = [];
    }

    // Resolve CPMKs
    if (cpmkIds.length > 0) {
        try {
            rpsJson.cpmk = await CPMK.findAll({
                where: { id: cpmkIds },
                attributes: ['id', 'kode_cpmk', 'deskripsi', 'cpl_id']
            });
        } catch (e) {
            console.error('Error resolving CPMKs:', e);
            rpsJson.cpmk = [];
        }
    } else {
        rpsJson.cpmk = [];
    }

    return rpsJson;
};

/**
 * Update RPS (draft only)
 * PUT /api/rps/:id
 */
export const updateRPS = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const updates = req.body;

        const rps = await RPS.findByPk(id);

        if (!rps) {
            return res.status(404).json({ message: 'RPS not found' });
        }

        // Only owner can edit
        if (rps.dosen_id !== user.id) {
            return res.status(403).json({ message: 'You can only edit your own RPS' });
        }

        // Only draft can be edited
        if (rps.status !== 'draft') {
            return res.status(400).json({
                message: 'Only draft RPS can be edited',
                currentStatus: rps.status
            });
        }

        // Update allowed fields
        const allowedFields = ['deskripsi_mk', 'capaian_pembelajaran', 'prasyarat', 'referensi', 'cpl_ids', 'cpmk_ids', 'rumpun_mk'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                rps[field] = updates[field];
            }
        });

        await rps.save();

        // Fetch updated RPS
        const updated = await RPS.findByPk(id, {
            include: [
                { model: MataKuliah, as: 'mata_kuliah' },
                { model: User, as: 'dosen', attributes: ['id', 'nama_lengkap'] }
            ]
        });

        const rpsWithInclusions = await resolveRPSInclusions(updated);

        res.json(rpsWithInclusions);
    } catch (error) {
        console.error('Update RPS error:', error);
        res.status(500).json({ message: 'Failed to update RPS' });
    }
};

/**
 * Submit RPS for approval
 * PUT /api/rps/:id/submit
 */
export const submitRPS = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const rps = await RPS.findByPk(id);

        if (!rps) {
            return res.status(404).json({ message: 'RPS not found' });
        }

        // Only owner can submit
        if (rps.dosen_id !== user.id) {
            return res.status(403).json({ message: 'You can only submit your own RPS' });
        }

        // Only draft can be submitted
        if (rps.status !== 'draft') {
            return res.status(400).json({
                message: 'Only draft RPS can be submitted',
                currentStatus: rps.status
            });
        }

        // Auto-approve if user is KAPRODI (and it's for their prodi - implicit since they are owner/creator)
        if (user.role === ROLES.KAPRODI) {
            rps.status = 'approved';
            rps.approved_by = user.id;
            rps.approved_at = new Date();
            rps.catatan_approval = 'Auto-approved by Kaprodi (Self-submission)';
        } else {
            rps.status = 'pending';
        }

        rps.submitted_at = new Date();
        await rps.save();

        res.json({ message: 'RPS submitted for approval', rps });
    } catch (error) {
        console.error('Submit RPS error:', error);
        res.status(500).json({ message: 'Failed to submit RPS' });
    }
};

/**
 * Approve RPS (Kaprodi only)
 * PUT /api/rps/:id/approve
 */
export const approveRPS = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { catatan_approval } = req.body;

        const rps = await RPS.findByPk(id, {
            include: [{
                model: MataKuliah,
                as: 'mata_kuliah',
                include: [{ model: Prodi, as: 'prodi' }]
            }]
        });

        if (!rps) {
            return res.status(404).json({ message: 'RPS not found' });
        }

        // Only kaprodi can approve
        if (user.role !== ROLES.KAPRODI) {
            return res.status(403).json({ message: 'Only Kaprodi can approve RPS' });
        }

        // Verify it's their prodi
        if (rps.mata_kuliah.prodi_id !== user.prodi_id) {
            return res.status(403).json({ message: 'You can only approve RPS for your prodi' });
        }

        // Allow 'pending' OR 'draft' to be approved (force approval)
        if (!['pending', 'draft'].includes(rps.status)) {
            return res.status(400).json({
                message: 'Only pending or draft RPS can be approved',
                currentStatus: rps.status
            });
        }

        rps.status = 'approved';
        rps.approved_by = user.id;
        rps.approved_at = new Date();
        if (catatan_approval) rps.catatan_approval = catatan_approval;

        await rps.save();

        const updated = await RPS.findByPk(id, {
            include: [
                { model: MataKuliah, as: 'mata_kuliah' },
                { model: User, as: 'dosen', attributes: ['id', 'nama_lengkap'] },
                { model: User, as: 'approved_by_user', attributes: ['id', 'nama_lengkap'] }
            ]
        });

        res.json({ message: 'RPS approved successfully', rps: updated });
    } catch (error) {
        console.error('Approve RPS error:', error);
        res.status(500).json({ message: 'Failed to approve RPS' });
    }
};

/**
 * Reject RPS (Kaprodi only)
 * PUT /api/rps/:id/reject
 */
export const rejectRPS = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const { catatan_approval } = req.body;

        if (!catatan_approval) {
            return res.status(400).json({ message: 'catatan_approval required for rejection' });
        }

        const rps = await RPS.findByPk(id, {
            include: [{
                model: MataKuliah,
                as: 'mata_kuliah',
                include: [{ model: Prodi, as: 'prodi' }]
            }]
        });

        if (!rps) {
            return res.status(404).json({ message: 'RPS not found' });
        }

        // Only kaprodi can reject
        if (user.role !== ROLES.KAPRODI) {
            return res.status(403).json({ message: 'Only Kaprodi can reject RPS' });
        }

        // Verify it's their prodi
        if (rps.mata_kuliah.prodi_id !== user.prodi_id) {
            return res.status(403).json({ message: 'You can only reject RPS for your prodi' });
        }

        // Allow 'pending' OR 'draft' to be rejected
        if (!['pending', 'draft'].includes(rps.status)) {
            return res.status(400).json({
                message: 'Only pending or draft RPS can be rejected',
                currentStatus: rps.status
            });
        }

        rps.status = 'rejected';
        rps.approved_by = user.id;
        rps.approved_at = new Date();
        rps.catatan_approval = catatan_approval;

        await rps.save();

        const updated = await RPS.findByPk(id, {
            include: [
                { model: MataKuliah, as: 'mata_kuliah' },
                { model: User, as: 'dosen', attributes: ['id', 'nama_lengkap'] },
                { model: User, as: 'approved_by_user', attributes: ['id', 'nama_lengkap'] }
            ]
        });

        res.json({ message: 'RPS rejected', rps: updated });
    } catch (error) {
        console.error('Reject RPS error:', error);
        res.status(500).json({ message: 'Failed to reject RPS' });
    }
};

/**
 * Delete RPS (draft only)
 * DELETE /api/rps/:id
 */
export const deleteRPS = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const rps = await RPS.findByPk(id);

        if (!rps) {
            return res.status(404).json({ message: 'RPS not found' });
        }

        // Only owner can delete
        if (rps.dosen_id !== user.id) {
            return res.status(403).json({ message: 'You can only delete your own RPS' });
        }

        // Only draft can be deleted
        if (rps.status !== 'draft') {
            return res.status(400).json({
                message: 'Only draft RPS can be deleted',
                currentStatus: rps.status
            });
        }

        await rps.destroy();

        res.json({ message: 'RPS deleted successfully', id });
    } catch (error) {
        console.error('Delete RPS error:', error);
        res.status(500).json({ message: 'Failed to delete RPS' });
    }
};

// ========== HELPER FUNCTIONS ==========

/**
 * Check if user can access RPS
 */
async function canUserAccessRPS(user, rps) {
    // Admin can access all
    if (user.role === ROLES.ADMIN_INSTITUSI) return true;

    // Owner can access own RPS
    if (rps.dosen_id === user.id) return true;

    // Kaprodi can access prodi RPS
    if (user.role === ROLES.KAPRODI) {
        const mataKuliah = await MataKuliah.findByPk(rps.mata_kuliah_id);
        return mataKuliah && mataKuliah.prodi_id === user.prodi_id;
    }

    // Dekan can access fakultas RPS
    if (user.role === ROLES.DEKAN) {
        const mataKuliah = await MataKuliah.findByPk(rps.mata_kuliah_id, {
            include: [{ model: Prodi, as: 'prodi' }]
        });
        return mataKuliah && mataKuliah.prodi.fakultas_id === user.fakultas_id;
    }

    return false;
}
