
import {
    CPL, CPMK, SubCPMK, BahanKajian, MataKuliah, Prodi, Fakultas, Institusi
} from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import csvParser from 'csv-parser';
import fs from 'fs';

// Helper to delete file after processing
const cleanupFile = (path) => {
    if (fs.existsSync(path)) fs.unlinkSync(path);
};

// ========== PRODI PREFIX HELPER ==========
const UNIT_PREFIXES = {
    'informatika': 'IF',
    'keperawatan': 'KEP',
    'ners': 'KEP',
    'kebidanan': 'KEB',
    'rekam medis': 'RMIK',
    'kesehatan masyarakat': 'KESMAS',
    'fisioterapi': 'FT',
    'farmasi': 'FAR',
    'gizi': 'GIZI',
    'manajemen': 'MAN',
    'akuntansi': 'AKT'
};

const getProdiPrefix = async (prodiId) => {
    if (!prodiId) return 'GEN';
    try {
        const prodi = await Prodi.findByPk(prodiId);
        if (!prodi) return 'GEN';
        const namaProdi = prodi.nama.toLowerCase();
        for (const [key, prefix] of Object.entries(UNIT_PREFIXES)) {
            if (namaProdi.includes(key)) return prefix;
        }
        // Fallback: first 3 chars uppercase
        return prodi.nama.substring(0, 3).toUpperCase();
    } catch (err) {
        return 'GEN';
    }
};

// Helper: Make code unique with (1) suffix if duplicate exists
const getUniqueCode = async (Model, field, baseCode, prodiId, excludeId = null) => {
    let finalCode = baseCode;
    let counter = 1;

    while (true) {
        const whereClause = { [field]: finalCode };
        if (prodiId) whereClause.prodi_id = prodiId;
        if (excludeId) whereClause.id = { [Op.ne]: excludeId };

        const existing = await Model.findOne({ where: whereClause });
        if (!existing) break;

        // Remove existing suffix and add new one
        const baseWithoutSuffix = baseCode.replace(/\s*\(\d+\)$/, '');
        finalCode = `${baseWithoutSuffix} (${counter})`;
        counter++;

        if (counter > 100) break; // Safety limit
    }

    return finalCode;
};

// ========== CPL ==========
export const getCPLs = async (req, res) => {
    try {
        const { prodi_id, role } = req.user;

        // Super admin sees all, Kaprodi sees only their prodi
        const whereClause = role === 'super_admin' ? {} : { prodi_id };

        const cpls = await CPL.findAll({
            where: whereClause,
            include: [
                { model: Prodi, as: 'prodi', attributes: ['id', 'nama'] },
                { model: Fakultas, as: 'fakultas', attributes: ['id', 'nama'] },
                { model: Institusi, as: 'institusi', attributes: ['id', 'nama'] }
            ],
            order: [['kode_tampilan', 'ASC']]
        });
        res.json(cpls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createCPL = async (req, res) => {
    try {
        const { prodi_id } = req.user;
        const level = req.body.level || 'prodi';

        // Get prodi prefix for internal code
        const prefix = await getProdiPrefix(prodi_id);

        // kode_tampilan is the user-provided display code (e.g., CPL01)
        let kodeTampilan = req.body.kode_tampilan || req.body.kode_cpl;

        // Check for duplicate and add suffix if needed
        kodeTampilan = await getUniqueCode(CPL, 'kode_tampilan', kodeTampilan, prodi_id);

        // Internal code: manually provided OR auto-generated
        let kodeInternal = req.body.kode_cpl || `${prefix}-${kodeTampilan.replace(/^[A-Z]+-/, '')}`;
        kodeInternal = await getUniqueCode(CPL, 'kode_cpl', kodeInternal, prodi_id);

        const cplData = {
            kode_cpl: kodeInternal,
            kode_tampilan: kodeTampilan,
            deskripsi: req.body.deskripsi,
            kategori: req.body.kategori,
            keterangan: req.body.keterangan,
            level: level,
            institusi_id: null,
            fakultas_id: null,
            prodi_id: prodi_id
        };

        const cpl = await CPL.create(cplData);
        res.status(201).json(cpl);
    } catch (error) {
        console.error('CPL Create Error:', error);
        res.status(500).json({ message: error.message });
    }
};


export const updateCPL = async (req, res) => {
    try {
        const { id } = req.params;
        const cpl = await CPL.findByPk(id);
        if (!cpl) return res.status(404).json({ message: 'CPL not found' });

        const prodi_id = req.body.prodi_id || cpl.prodi_id;
        const prefix = await getProdiPrefix(prodi_id);

        let kodeTampilan = req.body.kode_tampilan || cpl.kode_tampilan;
        kodeTampilan = await getUniqueCode(CPL, 'kode_tampilan', kodeTampilan, prodi_id, id);

        // Allow manual internal code update
        let kodeInternal = req.body.kode_cpl || `${prefix}-${kodeTampilan.replace(/^[A-Z]+-/, '')}`;
        kodeInternal = await getUniqueCode(CPL, 'kode_cpl', kodeInternal, prodi_id, id);

        await cpl.update({
            ...req.body,
            kode_cpl: kodeInternal,
            kode_tampilan: kodeTampilan,
            prodi_id
        });
        res.json(cpl);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteCPL = async (req, res) => {
    try {
        const { id } = req.params;
        const cpl = await CPL.findByPk(id);
        if (!cpl) return res.status(404).json({ message: 'CPL not found' });
        await cpl.destroy();
        res.json({ message: 'CPL deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const importCPL = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { mode = 'commit', on_conflict = 'skip' } = req.body; // mode: check | commit, on_conflict: overwrite | duplicate | skip
    const results = [];
    const conflicts = [];
    const errors = [];

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const firstLine = fileContent.split('\n')[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    fs.createReadStream(req.file.path)
        .pipe(csvParser({
            mapHeaders: ({ header }) => header.trim().replace(/^\ufeff/, ''),
            separator: separator
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            let successCount = 0;
            const t = mode === 'commit' ? await sequelize.transaction() : null;

            try {
                const prefix = await getProdiPrefix(req.user.prodi_id);

                for (let i = 0; i < results.length; i++) {
                    const row = results[i];
                    const rowNum = i + 2;
                    let { kode_cpl: kodeInput, deskripsi, keterangan, kategori, level, unit_name } = row;

                    if (!kodeInput && !deskripsi) continue;

                    const kodeTampilan = kodeInput;
                    const finalLevel = level?.toLowerCase() || 'prodi';

                    // Organizational ID resolution
                    let orgIds = { prodi_id: req.user.prodi_id, fakultas_id: null, institusi_id: null };
                    if (unit_name && finalLevel === 'prodi') {
                        const prodi = await Prodi.findOne({ where: { nama: { [Op.iLike]: `%${unit_name}%` } } });
                        if (prodi) orgIds = { prodi_id: prodi.id, fakultas_id: null, institusi_id: null };
                    } else if (unit_name && finalLevel === 'fakultas') {
                        const fak = await Fakultas.findOne({ where: { nama: { [Op.iLike]: `%${unit_name}%` } } });
                        if (fak) orgIds = { prodi_id: null, fakultas_id: fak.id, institusi_id: null };
                    } else if (finalLevel === 'institusi') {
                        const inst = await Institusi.findOne();
                        if (inst) orgIds = { prodi_id: null, fakultas_id: null, institusi_id: inst.id };
                    }

                    // Conflict Check
                    const existing = await CPL.findOne({
                        where: {
                            kode_tampilan: kodeTampilan,
                            ...(orgIds.prodi_id && { prodi_id: orgIds.prodi_id }),
                            ...(orgIds.fakultas_id && { fakultas_id: orgIds.fakultas_id }),
                            ...(orgIds.institusi_id && { institusi_id: orgIds.institusi_id }),
                        }
                    });

                    if (existing) {
                        if (mode === 'check') {
                            conflicts.push({ row: rowNum, code: kodeTampilan, existing: existing.id });
                            continue;
                        }

                        if (on_conflict === 'skip') {
                            continue;
                        } else if (on_conflict === 'duplicate') {
                            // Create new with suffix
                            const uniqueCode = await getUniqueCode(CPL, 'kode_tampilan', kodeTampilan, orgIds.prodi_id);
                            await CPL.create({
                                ...orgIds,
                                level: finalLevel,
                                kode_tampilan: uniqueCode,
                                kode_cpl: `${prefix}-${uniqueCode}`,
                                deskripsi: deskripsi || '-',
                                keterangan,
                                kategori
                            }, { transaction: t });
                        } else if (on_conflict === 'overwrite') {
                            await existing.update({ deskripsi, keterangan, kategori }, { transaction: t });
                        }
                    } else {
                        if (mode === 'commit') {
                            await CPL.create({
                                ...orgIds,
                                level: finalLevel,
                                kode_tampilan: kodeTampilan,
                                kode_cpl: `${prefix}-${kodeTampilan}`,
                                deskripsi: deskripsi || '-',
                                keterangan,
                                kategori
                            }, { transaction: t });
                        }
                    }
                    successCount++;
                }

                if (mode === 'commit') await t.commit();
                cleanupFile(req.file.path);

                res.json({
                    message: mode === 'check' ? `Check selesai. Ditemukan ${conflicts.length} konflik.` : `Import selesai. ${successCount} CPL diproses.`,
                    conflicts: conflicts.length > 0 ? conflicts : null,
                    successCount,
                    errors: errors.length > 0 ? errors : null
                });

            } catch (error) {
                if (t) await t.rollback();
                cleanupFile(req.file.path);
                res.status(500).json({ message: 'Proses gagal: ' + error.message });
            }
        });
};



// ========== BAHAN KAJIAN ==========
export const getBahanKajian = async (req, res) => {
    try {
        const { prodi_id, role } = req.user;
        const whereClause = role === 'super_admin' ? {} : { prodi_id };

        const bks = await BahanKajian.findAll({
            where: whereClause,
            include: [
                { model: Prodi, as: 'prodi', attributes: ['id', 'nama'] },
                { model: Fakultas, as: 'fakultas', attributes: ['id', 'nama'] },
                { model: Institusi, as: 'institusi', attributes: ['id', 'nama'] }
            ],
            order: [['kode_tampilan', 'ASC']]
        });
        res.json(bks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createBahanKajian = async (req, res) => {
    try {
        const { prodi_id } = req.user;

        // Get prodi prefix
        const prefix = await getProdiPrefix(prodi_id);

        // Display code from user input
        let kodeTampilan = req.body.kode_tampilan || req.body.kode_bk;

        // Check for duplicate and add suffix if needed
        kodeTampilan = await getUniqueCode(BahanKajian, 'kode_tampilan', kodeTampilan, prodi_id);

        // Internal code: manual OR auto
        let kodeInternal = req.body.kode_bk || `${prefix}-${kodeTampilan.replace(/^[A-Z]+-/, '')}`;
        kodeInternal = await getUniqueCode(BahanKajian, 'kode_bk', kodeInternal, prodi_id);

        const bk = await BahanKajian.create({
            ...req.body,
            kode_bk: kodeInternal,
            kode_tampilan: kodeTampilan,
            prodi_id
        });
        res.status(201).json(bk);
    } catch (error) {
        console.error('Create BK Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updateBahanKajian = async (req, res) => {
    try {
        const { id } = req.params;
        const bk = await BahanKajian.findByPk(id);
        if (!bk) return res.status(404).json({ message: 'Bahan Kajian not found' });

        const prodi_id = req.body.prodi_id || bk.prodi_id;
        const prefix = await getProdiPrefix(prodi_id);

        let kodeTampilan = req.body.kode_tampilan || bk.kode_tampilan;
        kodeTampilan = await getUniqueCode(BahanKajian, 'kode_tampilan', kodeTampilan, prodi_id, id);

        // Internal code: manual OR auto
        let kodeInternal = req.body.kode_bk || `${prefix}-${kodeTampilan.replace(/^[A-Z]+-/, '')}`;
        kodeInternal = await getUniqueCode(BahanKajian, 'kode_bk', kodeInternal, prodi_id, id);

        await bk.update({
            ...req.body,
            kode_bk: kodeInternal,
            kode_tampilan: kodeTampilan,
            prodi_id
        });
        res.json(bk);
    } catch (error) {
        console.error('Update BK Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteBahanKajian = async (req, res) => {
    try {
        const { id } = req.params;
        const bk = await BahanKajian.findByPk(id);
        if (!bk) return res.status(404).json({ message: 'Bahan Kajian not found' });
        await bk.destroy();
        res.json({ message: 'Bahan Kajian deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const importBahanKajian = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { mode = 'commit', on_conflict = 'skip' } = req.body;
    const results = [];
    const conflicts = [];
    const errors = [];

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const firstLine = fileContent.split('\n')[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    fs.createReadStream(req.file.path)
        .pipe(csvParser({
            mapHeaders: ({ header }) => header.trim().replace(/^\ufeff/, ''),
            separator: separator
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            let successCount = 0;
            const t = mode === 'commit' ? await sequelize.transaction() : null;

            try {
                const prefix = await getProdiPrefix(req.user.prodi_id);

                for (let i = 0; i < results.length; i++) {
                    const row = results[i];
                    const rowNum = i + 2;
                    let { kode_bk: kodeInput, jenis, deskripsi, bobot_min, bobot_max, level, unit_name } = row;

                    if (!kodeInput && !deskripsi) continue;

                    const kodeTampilan = kodeInput;
                    const finalLevel = level?.toLowerCase() || 'prodi';

                    // Org ID Resolution
                    let orgIds = { prodi_id: req.user.prodi_id, fakultas_id: null, institusi_id: null };
                    if (unit_name && finalLevel === 'prodi') {
                        const prodi = await Prodi.findOne({ where: { nama: { [Op.iLike]: `%${unit_name}%` } } });
                        if (prodi) orgIds = { prodi_id: prodi.id, fakultas_id: null, institusi_id: null };
                    } else if (unit_name && finalLevel === 'fakultas') {
                        const fak = await Fakultas.findOne({ where: { nama: { [Op.iLike]: `%${unit_name}%` } } });
                        if (fak) orgIds = { prodi_id: null, fakultas_id: fak.id, institusi_id: null };
                    } else if (finalLevel === 'institusi') {
                        const inst = await Institusi.findOne();
                        if (inst) orgIds = { prodi_id: null, fakultas_id: null, institusi_id: inst.id };
                    }

                    // Conflict Check
                    const existing = await BahanKajian.findOne({
                        where: {
                            kode_tampilan: kodeTampilan,
                            ...(orgIds.prodi_id && { prodi_id: orgIds.prodi_id }),
                            ...(orgIds.fakultas_id && { fakultas_id: orgIds.fakultas_id }),
                            ...(orgIds.institusi_id && { institusi_id: orgIds.institusi_id }),
                        }
                    });

                    if (existing) {
                        if (mode === 'check') {
                            conflicts.push({ row: rowNum, code: kodeTampilan, existing: existing.id });
                            continue;
                        }

                        if (on_conflict === 'skip') {
                            continue;
                        } else if (on_conflict === 'duplicate') {
                            const uniqueCode = await getUniqueCode(BahanKajian, 'kode_tampilan', kodeTampilan, orgIds.prodi_id);
                            await BahanKajian.create({
                                ...orgIds,
                                level: finalLevel,
                                kode_tampilan: uniqueCode,
                                kode_bk: `${prefix}-${uniqueCode}`,
                                jenis,
                                deskripsi: deskripsi || '-',
                                bobot_min: parseFloat(bobot_min) || 0,
                                bobot_max: parseFloat(bobot_max) || 0
                            }, { transaction: t });
                        } else if (on_conflict === 'overwrite') {
                            await existing.update({ jenis, deskripsi, bobot_min, bobot_max }, { transaction: t });
                        }
                    } else {
                        if (mode === 'commit') {
                            await BahanKajian.create({
                                ...orgIds,
                                level: finalLevel,
                                kode_tampilan: kodeTampilan,
                                kode_bk: `${prefix}-${kodeTampilan}`,
                                jenis,
                                deskripsi: deskripsi || '-',
                                bobot_min: parseFloat(bobot_min) || 0,
                                bobot_max: parseFloat(bobot_max) || 0
                            }, { transaction: t });
                        }
                    }
                    successCount++;
                }

                if (mode === 'commit') await t.commit();
                cleanupFile(req.file.path);

                res.json({
                    message: mode === 'check' ? `Check selesai. Ditemukan ${conflicts.length} konflik.` : `Import selesai. ${successCount} BK diproses.`,
                    conflicts: conflicts.length > 0 ? conflicts : null,
                    successCount
                });

            } catch (error) {
                if (t) await t.rollback();
                cleanupFile(req.file.path);
                res.status(500).json({ message: 'Proses gagal: ' + error.message });
            }
        });
};

// ========== CPMK (Requires MK Code) ==========
export const importCPMK = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { mode = 'commit', on_conflict = 'skip' } = req.body;
    const results = [];
    const conflicts = [];
    const errors = [];

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const firstLine = fileContent.split('\n')[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    fs.createReadStream(req.file.path)
        .pipe(csvParser({
            mapHeaders: ({ header }) => header.trim().replace(/^\ufeff/, ''),
            separator: separator
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            let successCount = 0;
            const t = mode === 'commit' ? await sequelize.transaction() : null;

            try {
                const prefix = await getProdiPrefix(req.user.prodi_id);

                for (let i = 0; i < results.length; i++) {
                    const row = results[i];
                    const rowNum = i + 2;
                    let { kode_mk, kode_cpmk: kodeInput, deskripsi, kode_cpl, level, unit_name } = row;

                    if (!deskripsi) {
                        errors.push(`Baris ${rowNum}: Deskripsi wajib diisi.`);
                        continue;
                    }

                    const kodeTampilan = kodeInput;
                    const finalLevel = level?.toLowerCase() || 'prodi';

                    // Org ID Resolution
                    let orgIds = { prodi_id: req.user.prodi_id, fakultas_id: null, institusi_id: null };
                    if (unit_name && finalLevel === 'prodi') {
                        const prodi = await Prodi.findOne({ where: { nama: { [Op.iLike]: `%${unit_name}%` } } });
                        if (prodi) orgIds = { prodi_id: prodi.id, fakultas_id: null, institusi_id: null };
                    } else if (unit_name && finalLevel === 'fakultas') {
                        const fak = await Fakultas.findOne({ where: { nama: { [Op.iLike]: `%${unit_name}%` } } });
                        if (fak) orgIds = { prodi_id: null, fakultas_id: fak.id, institusi_id: null };
                    } else if (finalLevel === 'institusi') {
                        const inst = await Institusi.findOne();
                        if (inst) orgIds = { prodi_id: null, fakultas_id: null, institusi_id: inst.id };
                    }

                    let mk = null;
                    if (kode_mk) {
                        mk = await MataKuliah.findOne({ where: { kode_mk, prodi_id: orgIds.prodi_id || req.user.prodi_id } });
                    }

                    let cplId = null;
                    if (kode_cpl) {
                        const cpl = await CPL.findOne({
                            where: {
                                [Op.or]: [{ kode_cpl: kode_cpl }, { kode_tampilan: kode_cpl }],
                                ...(orgIds.prodi_id && { prodi_id: orgIds.prodi_id })
                            }
                        });
                        if (cpl) cplId = cpl.id;
                    }

                    // Conflict Check
                    const existing = await CPMK.findOne({
                        where: {
                            kode_tampilan: kodeTampilan,
                            mata_kuliah_id: mk?.id || null,
                            ...(orgIds.prodi_id && { prodi_id: orgIds.prodi_id }),
                            ...(orgIds.fakultas_id && { fakultas_id: orgIds.fakultas_id }),
                            ...(orgIds.institusi_id && { institusi_id: orgIds.institusi_id }),
                        }
                    });

                    if (existing) {
                        if (mode === 'check') {
                            conflicts.push({ row: rowNum, code: kodeTampilan, existing: existing.id });
                            continue;
                        }

                        if (on_conflict === 'skip') {
                            continue;
                        } else if (on_conflict === 'duplicate') {
                            const uniqueCode = await getUniqueCode(CPMK, 'kode_tampilan', kodeTampilan, orgIds.prodi_id);
                            await CPMK.create({
                                ...orgIds,
                                level: finalLevel,
                                kode_tampilan: uniqueCode,
                                kode_cpmk: `${prefix}-CPMK-${uniqueCode}`,
                                deskripsi,
                                cpl_id: cplId,
                                mata_kuliah_id: mk?.id || null,
                                is_template: true
                            }, { transaction: t });
                        } else if (on_conflict === 'overwrite') {
                            await existing.update({ deskripsi, cpl_id: cplId, mata_kuliah_id: mk?.id || null }, { transaction: t });
                        }
                    } else {
                        if (mode === 'commit') {
                            await CPMK.create({
                                ...orgIds,
                                level: finalLevel,
                                kode_tampilan: kodeTampilan,
                                kode_cpmk: `${prefix}-CPMK-${kodeTampilan}`,
                                deskripsi,
                                cpl_id: cplId,
                                mata_kuliah_id: mk?.id || null,
                                is_template: true
                            }, { transaction: t });
                        }
                    }
                    successCount++;
                }

                if (mode === 'commit') await t.commit();
                cleanupFile(req.file.path);

                res.json({
                    message: mode === 'check' ? `Check selesai. Ditemukan ${conflicts.length} konflik.` : `Import selesai. ${successCount} CPMK diproses.`,
                    conflicts: conflicts.length > 0 ? conflicts : null,
                    successCount,
                    errors: errors.length > 0 ? errors : null
                });

            } catch (error) {
                if (t) await t.rollback();
                cleanupFile(req.file.path);
                console.error(error);
                res.status(500).json({ message: 'Proses gagal: ' + error.message });
            }
        });
};

export const getCPMKs = async (req, res) => {
    try {
        const { prodi_id, role } = req.user;
        const whereClause = role === 'super_admin' ? {} : { prodi_id };

        const cpmks = await CPMK.findAll({
            where: whereClause,
            include: [
                { model: MataKuliah, as: 'mata_kuliah' },
                { model: CPL, as: 'cpl' },
                { model: Prodi, as: 'prodi', attributes: ['id', 'nama'] },
                { model: Fakultas, as: 'fakultas', attributes: ['id', 'nama'] },
                { model: Institusi, as: 'institusi', attributes: ['id', 'nama'] }
            ],
            order: [['kode_tampilan', 'ASC']]
        });
        res.json(cpmks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createCPMK = async (req, res) => {
    try {
        const { prodi_id } = req.user;

        // Get prodi prefix
        const prefix = await getProdiPrefix(prodi_id);

        // Display code from user input
        let kodeTampilan = req.body.kode_tampilan || req.body.kode_cpmk;

        // Check for duplicate and add suffix if needed
        kodeTampilan = await getUniqueCode(CPMK, 'kode_tampilan', kodeTampilan, prodi_id);

        // Internal code: manual OR auto
        let kodeInternal = req.body.kode_cpmk || `${prefix}-${kodeTampilan.replace(/^[A-Z]+-/, '')}`;
        kodeInternal = await getUniqueCode(CPMK, 'kode_cpmk', kodeInternal, prodi_id);

        // Sanitize foreign keys: convert "" to null
        const cpl_id = req.body.cpl_id === '' ? null : req.body.cpl_id;
        const mk_id = req.body.mata_kuliah_id === '' ? null : req.body.mata_kuliah_id;

        const cpmk = await CPMK.create({
            ...req.body,
            cpl_id,
            mata_kuliah_id: mk_id,
            kode_cpmk: kodeInternal,
            kode_tampilan: kodeTampilan,
            prodi_id
        });
        res.status(201).json(cpmk);
    } catch (error) {
        console.error('Create CPMK Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updateCPMK = async (req, res) => {
    try {
        const { id } = req.params;
        const cpmk = await CPMK.findByPk(id);
        if (!cpmk) return res.status(404).json({ message: 'CPMK not found' });

        const prodi_id = req.body.prodi_id || cpmk.prodi_id;
        const prefix = await getProdiPrefix(prodi_id);

        let kodeTampilan = req.body.kode_tampilan || cpmk.kode_tampilan;
        kodeTampilan = await getUniqueCode(CPMK, 'kode_tampilan', kodeTampilan, prodi_id, id);

        // Internal code: manual OR auto
        let kodeInternal = req.body.kode_cpmk || `${prefix}-${kodeTampilan.replace(/^[A-Z]+-/, '')}`;
        kodeInternal = await getUniqueCode(CPMK, 'kode_cpmk', kodeInternal, prodi_id, id);

        // Sanitize foreign keys
        const cpl_id = req.body.cpl_id === '' ? null : (req.body.cpl_id || cpmk.cpl_id);
        const mk_id = req.body.mata_kuliah_id === '' ? null : (req.body.mata_kuliah_id || cpmk.mata_kuliah_id);

        await cpmk.update({
            ...req.body,
            cpl_id,
            mata_kuliah_id: mk_id,
            kode_cpmk: kodeInternal,
            kode_tampilan: kodeTampilan,
            prodi_id
        });
        res.json(cpmk);
    } catch (error) {
        console.error('Update CPMK Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteCPMK = async (req, res) => {
    try {
        const { id } = req.params;
        const cpmk = await CPMK.findByPk(id);
        if (!cpmk) return res.status(404).json({ message: 'CPMK not found' });
        await cpmk.destroy();
        res.json({ message: 'CPMK deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========== SUB-CPMK (Requires MK + CPMK Code) ==========
export const importSubCPMK = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { mode = 'commit', on_conflict = 'skip' } = req.body;
    const results = [];
    const conflicts = [];
    const errors = [];

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const firstLine = fileContent.split('\n')[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    fs.createReadStream(req.file.path)
        .pipe(csvParser({
            mapHeaders: ({ header }) => header.trim().replace(/^\ufeff/, ''),
            separator: separator
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            let successCount = 0;
            const t = mode === 'commit' ? await sequelize.transaction() : null;

            try {
                const prefix = await getProdiPrefix(req.user.prodi_id);

                for (let i = 0; i < results.length; i++) {
                    const row = results[i];
                    const rowNum = i + 2;
                    let { kode_mk, kode_cpmk, kode_sub_cpmk: kodeInput, deskripsi, bobot_persen, level, unit_name } = row;

                    if (!kode_mk || !kode_cpmk) {
                        errors.push(`Baris ${rowNum}: Kode MK dan CPMK wajib diisi.`);
                        continue;
                    }

                    const kodeTampilan = kodeInput;
                    const finalLevel = level?.toLowerCase() || 'prodi';

                    // Org ID Resolution
                    let orgIds = { prodi_id: req.user.prodi_id, fakultas_id: null, institusi_id: null };
                    if (unit_name && finalLevel === 'prodi') {
                        const prodi = await Prodi.findOne({ where: { nama: { [Op.iLike]: `%${unit_name}%` } } });
                        if (prodi) orgIds = { prodi_id: prodi.id, fakultas_id: null, institusi_id: null };
                    } else if (unit_name && finalLevel === 'fakultas') {
                        const fak = await Fakultas.findOne({ where: { nama: { [Op.iLike]: `%${unit_name}%` } } });
                        if (fak) orgIds = { prodi_id: null, fakultas_id: fak.id, institusi_id: null };
                    } else if (finalLevel === 'institusi') {
                        const inst = await Institusi.findOne();
                        if (inst) orgIds = { prodi_id: null, fakultas_id: null, institusi_id: inst.id };
                    }

                    const mk = await MataKuliah.findOne({ where: { kode_mk, prodi_id: orgIds.prodi_id || req.user.prodi_id } });
                    if (!mk) {
                        errors.push(`Baris ${rowNum}: MK ${kode_mk} tidak ditemukan.`);
                        continue;
                    }

                    const cpmk = await CPMK.findOne({
                        where: { [Op.or]: [{ kode_cpmk: kode_cpmk }, { kode_tampilan: kode_cpmk }], mata_kuliah_id: mk.id }
                    });
                    if (!cpmk) {
                        errors.push(`Baris ${rowNum}: CPMK ${kode_cpmk} untuk MK ${kode_mk} tidak ditemukan.`);
                        continue;
                    }

                    // Conflict Check
                    const existing = await SubCPMK.findOne({
                        where: {
                            kode_tampilan: kodeTampilan,
                            cpmk_id: cpmk.id,
                            ...(orgIds.prodi_id && { prodi_id: orgIds.prodi_id }),
                            ...(orgIds.fakultas_id && { fakultas_id: orgIds.fakultas_id }),
                            ...(orgIds.institusi_id && { institusi_id: orgIds.institusi_id }),
                        }
                    });

                    if (existing) {
                        if (mode === 'check') {
                            conflicts.push({ row: rowNum, code: kodeTampilan, existing: existing.id });
                            continue;
                        }

                        if (on_conflict === 'skip') {
                            continue;
                        } else if (on_conflict === 'duplicate') {
                            const uniqueCode = await getUniqueCode(SubCPMK, 'kode_tampilan', kodeTampilan, orgIds.prodi_id);
                            await SubCPMK.create({
                                ...orgIds,
                                level: finalLevel,
                                kode_tampilan: uniqueCode,
                                kode_sub_cpmk: `${prefix}-${uniqueCode}`,
                                deskripsi,
                                cpmk_id: cpmk.id,
                                bobot_nilai: parseFloat(bobot_persen) || 0,
                                is_template: true
                            }, { transaction: t });
                        } else if (on_conflict === 'overwrite') {
                            await existing.update({ deskripsi, bobot_nilai: parseFloat(bobot_persen) || 0 }, { transaction: t });
                        }
                    } else {
                        if (mode === 'commit') {
                            await SubCPMK.create({
                                ...orgIds,
                                level: finalLevel,
                                kode_tampilan: kodeTampilan,
                                kode_sub_cpmk: `${prefix}-${kodeTampilan}`,
                                deskripsi,
                                cpmk_id: cpmk.id,
                                bobot_nilai: parseFloat(bobot_persen) || 0,
                                is_template: true
                            }, { transaction: t });
                        }
                    }
                    successCount++;
                }

                if (mode === 'commit') await t.commit();
                cleanupFile(req.file.path);

                res.json({
                    message: mode === 'check' ? `Check selesai. Ditemukan ${conflicts.length} konflik.` : `Import selesai. ${successCount} Sub-CPMK diproses.`,
                    conflicts: conflicts.length > 0 ? conflicts : null,
                    successCount,
                    errors: errors.length > 0 ? errors : null
                });

            } catch (error) {
                if (t) await t.rollback();
                cleanupFile(req.file.path);
                console.error(error);
                res.status(500).json({ message: 'Proses gagal: ' + error.message });
            }
        });
};

export const getSubCPMKs = async (req, res) => {
    try {
        const { prodi_id, role } = req.user;
        const whereClause = role === 'super_admin' ? {} : { prodi_id };

        const subs = await SubCPMK.findAll({
            where: whereClause,
            include: [
                { model: CPMK, as: 'cpmk' },
                { model: Prodi, as: 'prodi', attributes: ['id', 'nama'] },
                { model: Fakultas, as: 'fakultas', attributes: ['id', 'nama'] },
                { model: Institusi, as: 'institusi', attributes: ['id', 'nama'] }
            ],
            order: [['kode_tampilan', 'ASC']]
        });
        res.json(subs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createSubCPMK = async (req, res) => {
    try {
        const { prodi_id } = req.user;

        // Get prodi prefix
        const prefix = await getProdiPrefix(prodi_id);

        // Display code from user input
        let kodeTampilan = req.body.kode_tampilan || req.body.kode_sub_cpmk;

        // Check for duplicate and add suffix if needed
        kodeTampilan = await getUniqueCode(SubCPMK, 'kode_tampilan', kodeTampilan, prodi_id);

        // Internal code: manual OR auto
        let kodeInternal = req.body.kode_sub_cpmk || `${prefix}-${kodeTampilan.replace(/^[A-Z]+-/, '')}`;
        kodeInternal = await getUniqueCode(SubCPMK, 'kode_sub_cpmk', kodeInternal, prodi_id);

        // Sanitize cpmk_id
        const cpmk_id = req.body.cpmk_id === '' ? null : req.body.cpmk_id;

        const sub = await SubCPMK.create({
            ...req.body,
            cpmk_id,
            kode_sub_cpmk: kodeInternal,
            kode_tampilan: kodeTampilan,
            prodi_id
        });
        res.status(201).json(sub);
    } catch (error) {
        console.error('Create SubCPMK Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updateSubCPMK = async (req, res) => {
    try {
        const { id } = req.params;
        const sub = await SubCPMK.findByPk(id);
        if (!sub) return res.status(404).json({ message: 'Sub-CPMK not found' });

        const prodi_id = req.body.prodi_id || sub.prodi_id;
        const prefix = await getProdiPrefix(prodi_id);

        let kodeTampilan = req.body.kode_tampilan || sub.kode_tampilan;
        kodeTampilan = await getUniqueCode(SubCPMK, 'kode_tampilan', kodeTampilan, prodi_id, id);

        // Internal code: manual OR auto
        let kodeInternal = req.body.kode_sub_cpmk || `${prefix}-${kodeTampilan.replace(/^[A-Z]+-/, '')}`;
        kodeInternal = await getUniqueCode(SubCPMK, 'kode_sub_cpmk', kodeInternal, prodi_id, id);

        // Sanitize cpmk_id
        const cpmk_id = req.body.cpmk_id === '' ? null : (req.body.cpmk_id || sub.cpmk_id);

        await sub.update({
            ...req.body,
            cpmk_id,
            kode_sub_cpmk: kodeInternal,
            kode_tampilan: kodeTampilan,
            prodi_id
        });
        res.json(sub);
    } catch (error) {
        console.error('Update SubCPMK Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteSubCPMK = async (req, res) => {
    try {
        const { id } = req.params;
        const sub = await SubCPMK.findByPk(id);
        if (!sub) return res.status(404).json({ message: 'Sub-CPMK not found' });
        await sub.destroy();
        res.json({ message: 'Sub-CPMK deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ========== MATA KULIAH ==========
export const importMataKuliah = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const results = [];

    console.log('Starting Import MK...');
    // Detect separator
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const firstLine = fileContent.split('\n')[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    console.log(`Detected separator: '${separator}'`);

    fs.createReadStream(req.file.path)
        .pipe(csvParser({
            mapHeaders: ({ header }) => header.trim().replace(/^\ufeff/, ''),
            separator: separator
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            let successCount = 0;
            const errors = [];
            const t = await sequelize.transaction();
            try {
                for (let i = 0; i < results.length; i++) {
                    const row = results[i];
                    const rowNum = i + 2;
                    const { kode_mk, nama_mk, sks, semester, deskripsi } = row;

                    if (!kode_mk || !nama_mk) {
                        errors.push(`Baris ${rowNum}: Kode MK dan Nama MK wajib diisi.`);
                        continue;
                    }

                    const [mk, created] = await MataKuliah.findOrCreate({
                        where: { kode_mk, prodi_id: req.user.prodi_id },
                        defaults: {
                            nama_mk,
                            sks: parseInt(sks) || 3,
                            semester: parseInt(semester) || 1,
                            deskripsi,
                            scope: 'prodi',
                            is_active: true
                        },
                        transaction: t
                    });

                    if (!created) {
                        await mk.update({
                            nama_mk,
                            sks: parseInt(sks) || 3,
                            semester: parseInt(semester) || 1,
                            deskripsi
                        }, { transaction: t });
                    }
                    successCount++;
                }
                await t.commit();
                cleanupFile(req.file.path);
                res.json({
                    message: `Import MK selesai. ${successCount} item berhasil diproses.`,
                    errors: errors.length > 0 ? errors : null
                });
            } catch (error) {
                await t.rollback();
                cleanupFile(req.file.path);
                res.status(500).json({ message: 'Import gagal: ' + error.message });
            }
        });
};

// ========== BATCH DELETE ==========
export const deleteBatchCPMK = async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: 'Invalid IDs' });

    try {
        await CPMK.destroy({
            where: {
                id: { [Op.in]: ids }
            }
        });
        res.json({ message: `${ids.length} CPMKs deleted successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteBatchSubCPMK = async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: 'Invalid IDs' });

    try {
        await SubCPMK.destroy({
            where: {
                id: { [Op.in]: ids }
            }
        });
        res.json({ message: `${ids.length} Sub-CPMKs deleted successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
