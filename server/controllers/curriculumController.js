import { CPL, CPMK, SubCPMK } from '../models/index.js';

// Get all CPL
export const getAllCPL = async (req, res) => {
    try {
        const cpl = await CPL.findAll({
            order: [['kode_cpl', 'ASC']],
            attributes: ['id', 'kode_cpl', 'deskripsi', 'keterangan', 'kategori']
        });

        res.json(cpl);
    } catch (error) {
        console.error('Get CPL error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get all CPMK
export const getAllCPMK = async (req, res) => {
    try {
        const cpmk = await CPMK.findAll({
            include: [{
                model: CPL,
                as: 'cpl',
                attributes: ['id', 'kode_cpl']
            }],
            order: [['kode_cpmk', 'ASC']]
        });

        res.json(cpmk);
    } catch (error) {
        console.error('Get CPMK error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get all Sub-CPMK
export const getAllSubCPMK = async (req, res) => {
    try {
        const subCpmk = await SubCPMK.findAll({
            include: [{
                model: CPMK,
                as: 'cpmk',
                attributes: ['id', 'kode_cpmk', 'deskripsi']
            }],
            order: [['kode_sub_cpmk', 'ASC']]
        });

        res.json(subCpmk);
    } catch (error) {
        console.error('Get Sub-CPMK error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Create CPL
export const createCPL = async (req, res) => {
    try {
        const { kode_cpl, deskripsi, keterangan, kategori, prodi_id, pl_id } = req.body;

        const cpl = await CPL.create({
            kode_cpl,
            deskripsi,
            keterangan,
            kategori,
            prodi_id: prodi_id || req.user.prodi_id,
            pl_id
        });

        res.status(201).json(cpl);
    } catch (error) {
        console.error('Create CPL error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Create CPMK
export const createCPMK = async (req, res) => {
    try {
        const { kode_cpmk, deskripsi, cpl_id, mata_kuliah_id, is_template } = req.body;

        const cpmk = await CPMK.create({
            kode_cpmk,
            deskripsi,
            cpl_id,
            mata_kuliah_id,
            is_template: is_template !== undefined ? is_template : true,
            created_by: req.user.id
        });

        // Fetch again to include CPL
        const created = await CPMK.findByPk(cpmk.id, {
            include: [{ model: CPL, as: 'cpl', attributes: ['id', 'kode_cpl'] }]
        });

        res.status(201).json(created);
    } catch (error) {
        console.error('Create CPMK error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update CPMK
export const updateCPMK = async (req, res) => {
    try {
        const { id } = req.params;
        const { kode_cpmk, deskripsi, cpl_id } = req.body;

        const cpmk = await CPMK.findByPk(id);

        if (!cpmk) {
            return res.status(404).json({ message: 'CPMK not found' });
        }

        await cpmk.update({
            kode_cpmk,
            deskripsi,
            cpl_id
        });

        // Fetch updated to include CPL
        const updated = await CPMK.findByPk(id, {
            include: [{ model: CPL, as: 'cpl', attributes: ['id', 'kode_cpl'] }]
        });

        res.json(updated);
    } catch (error) {
        console.error('Update CPMK error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete CPMK
export const deleteCPMK = async (req, res) => {
    try {
        const { id } = req.params;
        const cpmk = await CPMK.findByPk(id);

        if (!cpmk) {
            return res.status(404).json({ message: 'CPMK not found' });
        }

        await cpmk.destroy();

        res.json({ message: 'CPMK deleted successfully' });
    } catch (error) {
        console.error('Delete CPMK error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Bulk import CPL (with CSV data)
export const bulkImportCPL = async (req, res) => {
    try {
        const { data } = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        const created = await CPL.bulkCreate(data, {
            updateOnDuplicate: ['deskripsi', 'keterangan', 'kategori']
        });

        res.status(201).json({
            message: `${created.length} CPL imported successfully`,
            count: created.length
        });
    } catch (error) {
        console.error('Bulk import CPL error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update CPL
export const updateCPL = async (req, res) => {
    try {
        const { id } = req.params;
        const { kode_cpl, deskripsi, keterangan, kategori } = req.body;

        const cpl = await CPL.findByPk(id);

        if (!cpl) {
            return res.status(404).json({ message: 'CPL not found' });
        }

        await cpl.update({
            kode_cpl,
            deskripsi,
            keterangan,
            kategori
        });

        res.json(cpl);
    } catch (error) {
        console.error('Update CPL error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete CPL
export const deleteCPL = async (req, res) => {
    try {
        const { id } = req.params;

        const cpl = await CPL.findByPk(id);

        if (!cpl) {
            return res.status(404).json({ message: 'CPL not found' });
        }

        await cpl.destroy();

        res.json({ message: 'CPL deleted successfully' });
    } catch (error) {
        console.error('Delete CPL error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Create Sub-CPMK
export const createSubCPMK = async (req, res) => {
    try {
        const { cpmk_id, kode_sub_cpmk, deskripsi, indikator, bobot_nilai } = req.body;

        const sub = await SubCPMK.create({
            cpmk_id,
            kode_sub_cpmk,
            deskripsi,
            indikator,
            bobot_nilai,
            is_template: true
        });

        const created = await SubCPMK.findByPk(sub.id, {
            include: [{ model: CPMK, as: 'cpmk', include: [{ model: CPL, as: 'cpl' }] }]
        });

        res.status(201).json(created);
    } catch (error) {
        console.error('Create Sub-CPMK error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update Sub-CPMK
export const updateSubCPMK = async (req, res) => {
    try {
        const { id } = req.params;
        const { cpmk_id, kode_sub_cpmk, deskripsi, indikator, bobot_nilai } = req.body;

        const sub = await SubCPMK.findByPk(id);
        if (!sub) return res.status(404).json({ message: 'Sub-CPMK not found' });

        await sub.update({ cpmk_id, kode_sub_cpmk, deskripsi, indikator, bobot_nilai });

        const updated = await SubCPMK.findByPk(id, {
            include: [{ model: CPMK, as: 'cpmk', include: [{ model: CPL, as: 'cpl' }] }]
        });

        res.json(updated);
    } catch (error) {
        console.error('Update Sub-CPMK error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete Sub-CPMK
export const deleteSubCPMK = async (req, res) => {
    try {
        const { id } = req.params;
        const sub = await SubCPMK.findByPk(id);
        if (!sub) return res.status(404).json({ message: 'Sub-CPMK not found' });

        await sub.destroy();
        res.json({ message: 'Sub-CPMK deleted successfully' });
    } catch (error) {
        console.error('Delete Sub-CPMK error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
