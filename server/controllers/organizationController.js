import { Institusi, Fakultas, Prodi, User } from '../models/index.js';

/**
 * Get institution information
 * GET /api/organization/institusi
 */
export const getInstitusi = async (req, res) => {
    try {
        const institusi = await Institusi.findOne({
            where: { is_active: true },
            attributes: ['id', 'nama', 'nama_lengkap', 'jenis', 'singkatan', 'alamat', 'website', 'email', 'telepon', 'logo_url']
        });

        if (!institusi) {
            return res.status(404).json({ message: 'Institution not found' });
        }

        // Get counts
        const fakultasCount = await Fakultas.count({ where: { institusi_id: institusi.id, is_active: true } });
        const prodiCount = await Prodi.count({ where: { is_active: true } });
        const userCount = await User.count({ where: { is_active: true } });

        res.json({
            ...institusi.toJSON(),
            statistics: {
                fakultasCount,
                prodiCount,
                userCount
            }
        });
    } catch (error) {
        console.error('Get institusi error:', error);
        res.status(500).json({ message: 'Failed to retrieve institution data' });
    }
};

/**
 * Get all fakultas
 * GET /api/organization/fakultas
 */
export const getAllFakultas = async (req, res) => {
    try {
        const fakultasList = await Fakultas.findAll({
            where: { is_active: true },
            attributes: ['id', 'institusi_id', 'kode', 'nama', 'deskripsi', 'dekan_user_id'],
            include: [
                {
                    model: User,
                    as: 'dekan',
                    attributes: ['id', 'nama_lengkap', 'email']
                },
                {
                    model: Prodi,
                    as: 'prodi',
                    attributes: ['id', 'kode', 'nama', 'jenjang'],
                    where: { is_active: true },
                    required: false
                }
            ],
            order: [['kode', 'ASC']]
        });

        // Add prodi count to each fakultas
        const fakultasWithCounts = fakultasList.map(fak => {
            const fakData = fak.toJSON();
            return {
                ...fakData,
                prodiCount: fakData.prodi ? fakData.prodi.length : 0
            };
        });

        res.json(fakultasWithCounts);
    } catch (error) {
        console.error('Get all fakultas error:', error);
        res.status(500).json({ message: 'Failed to retrieve fakultas data' });
    }
};

/**
 * Get fakultas by ID with full prodi list
 * GET /api/organization/fakultas/:id
 */
export const getFakultasById = async (req, res) => {
    try {
        const { id } = req.params;

        const fakultas = await Fakultas.findByPk(id, {
            include: [
                {
                    model: Institusi,
                    as: 'institusi',
                    attributes: ['id', 'nama', 'singkatan']
                },
                {
                    model: User,
                    as: 'dekan',
                    attributes: ['id', 'nama_lengkap', 'email', 'telepon']
                },
                {
                    model: Prodi,
                    as: 'prodi',
                    where: { is_active: true },
                    required: false,
                    include: [
                        {
                            model: User,
                            as: 'kaprodi',
                            attributes: ['id', 'nama_lengkap', 'email']
                        }
                    ]
                }
            ]
        });

        if (!fakultas || !fakultas.is_active) {
            return res.status(404).json({ message: 'Fakultas not found' });
        }

        // Get statistics
        const dosenCount = await User.count({
            where: { role: 'dosen', prodi_id: fakultas.prodi.map(p => p.id), is_active: true }
        });

        const mahasiswaCount = await User.count({
            where: { role: 'mahasiswa', prodi_id: fakultas.prodi.map(p => p.id), is_active: true }
        });

        res.json({
            ...fakultas.toJSON(),
            statistics: {
                prodiCount: fakultas.prodi.length,
                dosenCount,
                mahasiswaCount
            }
        });
    } catch (error) {
        console.error('Get fakultas by ID error:', error);
        res.status(500).json({ message: 'Failed to retrieve fakultas data' });
    }

};

/**
 * Create new fakultas
 * POST /api/organization/fakultas
 */
export const createFakultas = async (req, res) => {
    try {
        const { kode, nama, deskripsi, dekan_user_id } = req.body;

        // Get active institution
        const institusi = await Institusi.findOne({ where: { is_active: true } });
        if (!institusi) {
            return res.status(400).json({ message: 'No active institution found' });
        }

        const newFakultas = await Fakultas.create({
            institusi_id: institusi.id,
            kode,
            nama,
            deskripsi,
            dekan_user_id: dekan_user_id || null,
            is_active: true
        });

        res.status(201).json(newFakultas);
    } catch (error) {
        console.error('Create fakultas error:', error);
        res.status(500).json({ message: 'Failed to create fakultas' });
    }
};

/**
 * Update fakultas
 * PUT /api/organization/fakultas/:id
 */
export const updateFakultas = async (req, res) => {
    try {
        const { id } = req.params;
        const { kode, nama, deskripsi, dekan_user_id, is_active } = req.body;

        const fakultas = await Fakultas.findByPk(id);
        if (!fakultas) {
            return res.status(404).json({ message: 'Fakultas not found' });
        }

        fakultas.kode = kode || fakultas.kode;
        fakultas.nama = nama || fakultas.nama;
        fakultas.deskripsi = deskripsi !== undefined ? deskripsi : fakultas.deskripsi;
        fakultas.dekan_user_id = dekan_user_id !== undefined ? dekan_user_id : fakultas.dekan_user_id;
        fakultas.is_active = is_active !== undefined ? is_active : fakultas.is_active;

        await fakultas.save();
        res.json(fakultas);
    } catch (error) {
        console.error('Update fakultas error:', error);
        res.status(500).json({ message: 'Failed to update fakultas' });
    }
};

/**
 * Delete fakultas
 * DELETE /api/organization/fakultas/:id
 */
export const deleteFakultas = async (req, res) => {
    try {
        const { id } = req.params;
        const fakultas = await Fakultas.findByPk(id);

        if (!fakultas) {
            return res.status(404).json({ message: 'Fakultas not found' });
        }

        // Soft delete
        fakultas.is_active = false;
        await fakultas.save();

        // Or hard delete if preferred, but check constraints
        // await fakultas.destroy();

        res.json({ message: 'Fakultas deleted successfully' });
    } catch (error) {
        console.error('Delete fakultas error:', error);
        res.status(500).json({ message: 'Failed to delete fakultas' });
    }
};

/**
 * Get all prodi (optionally filtered by fakultas)
 * GET /api/organization/prodi?fakultasId=X
 */
export const getAllProdi = async (req, res) => {
    try {
        const { fakultasId } = req.query;
        const whereClause = { is_active: true };

        if (fakultasId) {
            whereClause.fakultas_id = parseInt(fakultasId);
        }

        const prodiList = await Prodi.findAll({
            where: whereClause,
            attributes: ['id', 'fakultas_id', 'kode', 'nama', 'jenjang', 'deskripsi', 'kaprodi_user_id'],
            include: [
                {
                    model: Fakultas,
                    as: 'fakultas',
                    attributes: ['id', 'kode', 'nama']
                },
                {
                    model: User,
                    as: 'kaprodi',
                    attributes: ['id', 'nama_lengkap', 'email']
                }
            ],
            order: [['fakultas_id', 'ASC'], ['kode', 'ASC']]
        });

        res.json(prodiList);
    } catch (error) {
        console.error('Get all prodi error:', error);
        res.status(500).json({ message: 'Failed to retrieve prodi data' });
    }
};

/**
 * Get prodi by ID with details
 * GET /api/organization/prodi/:id
 */
export const getProdiById = async (req, res) => {
    try {
        const { id } = req.params;

        const prodi = await Prodi.findByPk(id, {
            include: [
                {
                    model: Fakultas,
                    as: 'fakultas',
                    attributes: ['id', 'kode', 'nama'],
                    include: [
                        {
                            model: Institusi,
                            as: 'institusi',
                            attributes: ['id', 'nama', 'singkatan']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'kaprodi',
                    attributes: ['id', 'nama_lengkap', 'email', 'telepon', 'nidn']
                }
            ]
        });

        if (!prodi || !prodi.is_active) {
            return res.status(404).json({ message: 'Prodi not found' });
        }

        // Get statistics
        const dosenCount = await User.count({
            where: { role: 'dosen', prodi_id: prodi.id, is_active: true }
        });

        const mahasiswaCount = await User.count({
            where: { role: 'mahasiswa', prodi_id: prodi.id, is_active: true }
        });

        res.json({
            ...prodi.toJSON(),
            statistics: {
                dosenCount,
                mahasiswaCount
            }
        });
    } catch (error) {
        console.error('Get prodi by ID error:', error);
        res.status(500).json({ message: 'Failed to retrieve prodi data' });
    }
};



/**
 * Create new prodi
 * POST /api/organization/prodi
 */
export const createProdi = async (req, res) => {
    try {
        const { fakultas_id, kode, nama, jenjang, deskripsi, kaprodi_user_id } = req.body;

        const newProdi = await Prodi.create({
            fakultas_id,
            kode,
            nama,
            jenjang,
            deskripsi,
            kaprodi_user_id: kaprodi_user_id || null,
            is_active: true
        });

        res.status(201).json(newProdi);
    } catch (error) {
        console.error('Create prodi error:', error);
        res.status(500).json({ message: 'Failed to create prodi' });
    }
};

/**
 * Update prodi
 * PUT /api/organization/prodi/:id
 */
export const updateProdi = async (req, res) => {
    try {
        const { id } = req.params;
        const { fakultas_id, kode, nama, jenjang, deskripsi, kaprodi_user_id, is_active } = req.body;

        const prodi = await Prodi.findByPk(id);
        if (!prodi) {
            return res.status(404).json({ message: 'Prodi not found' });
        }

        prodi.fakultas_id = fakultas_id || prodi.fakultas_id;
        prodi.kode = kode || prodi.kode;
        prodi.nama = nama || prodi.nama;
        prodi.jenjang = jenjang || prodi.jenjang;
        prodi.deskripsi = deskripsi !== undefined ? deskripsi : prodi.deskripsi;
        prodi.kaprodi_user_id = kaprodi_user_id !== undefined ? kaprodi_user_id : prodi.kaprodi_user_id;
        prodi.is_active = is_active !== undefined ? is_active : prodi.is_active;

        await prodi.save();
        res.json(prodi);
    } catch (error) {
        console.error('Update prodi error:', error);
        res.status(500).json({ message: 'Failed to update prodi' });
    }
};

/**
 * Delete prodi
 * DELETE /api/organization/prodi/:id
 */
export const deleteProdi = async (req, res) => {
    try {
        const { id } = req.params;
        const prodi = await Prodi.findByPk(id);

        if (!prodi) {
            return res.status(404).json({ message: 'Prodi not found' });
        }

        // Soft delete
        prodi.is_active = false;
        await prodi.save();

        res.json({ message: 'Prodi deleted successfully' });
    } catch (error) {
        console.error('Delete prodi error:', error);
        res.status(500).json({ message: 'Failed to delete prodi' });
    }
};
