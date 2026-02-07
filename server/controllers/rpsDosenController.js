import {
    RPS,
    RPSPertemuan,
    MataKuliah,
    CPL,
    CPMK,
    SubCPMK,
    Prodi,
    User
} from '../models/index.js';

import { Op } from 'sequelize';

/**
 * Get curriculum tree (CPL -> CPMK -> Sub-CPMK) for a prodi
 * Optional query: ?courseId=123 to filter CPMKs by course
 */
export const getCurriculumTree = async (req, res) => {
    try {
        const { prodiId } = req.params;
        const { courseId } = req.query;

        // Build include conditions
        const cpmkInclude = {
            model: CPMK,
            as: 'cpmk',
            required: false,
            include: [
                {
                    model: SubCPMK,
                    as: 'sub_cpmk',
                    required: false
                }
            ]
        };

        // If courseId provided, filter CPMKs by this course OR templates
        if (courseId) {
            cpmkInclude.where = {
                [Op.or]: [
                    { mata_kuliah_id: courseId },
                    { is_template: true }
                ]
            };
        }

        const cpls = await CPL.findAll({
            where: { prodi_id: prodiId },
            include: [cpmkInclude],
            order: [['kode_cpl', 'ASC']]
        });

        // Flatten to match frontend expected format
        const formattedCpls = cpls.map(cpl => ({
            id: cpl.id,
            kode: cpl.kode_cpl,
            deskripsi: cpl.deskripsi,
            cpmks: (cpl.cpmk || []).map(cpmk => ({
                id: cpmk.id,
                kode: cpmk.kode_cpmk,
                deskripsi: cpmk.deskripsi,
                mata_kuliah_id: cpmk.mata_kuliah_id,
                subCpmks: cpmk.sub_cpmk || []
            }))
        }));

        res.json({ cpls: formattedCpls });
    } catch (error) {
        console.error('Error fetching curriculum tree:', error);
        res.status(500).json({ message: 'Failed to fetch curriculum tree', error: error.message });
    }
};

/**
 * Create new RPS (Dosen only)
 */
export const createRPS = async (req, res) => {
    try {
        const {
            mata_kuliah_id,
            semester,
            tahun_ajaran,
            deskripsi_mk,
            rumpun_mk,
            pengembang_rps,
            koordinator_rumpun_mk,
            ketua_prodi,
            cpl_ids,
            cpmk_ids,
            sub_cpmk_list // Add this
        } = req.body;

        console.log('Creating RPS with data:', { mata_kuliah_id, semester, tahun_ajaran, user_id: req.user?.id });

        // Verify course exists
        const mataKuliah = await MataKuliah.findByPk(mata_kuliah_id);
        if (!mataKuliah) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check for duplicate - only if not allowing revisions
        const existing = await RPS.findOne({
            where: {
                mata_kuliah_id,
                semester,
                tahun_ajaran
            },
            order: [['revision', 'DESC']]
        });

        if (existing) {
            // Instead of returning it, we should suggest creating a revision if it's not draft
            if (existing.status !== 'draft') {
                // For now, let's just return it as before to avoid breaking old flow,
                // but normally UI should handle this by calling createRevision
                return res.status(200).json({
                    message: 'RPS already exists',
                    rps: existing,
                    isExisting: true
                });
            }
            return res.status(200).json({
                message: 'Draft RPS already exists',
                rps: existing,
                isExisting: true
            });
        }

        // Create RPS - use req.user.id directly
        const rps = await RPS.create({
            mata_kuliah_id,
            semester,
            tahun_ajaran,
            deskripsi_mk: deskripsi_mk || '',
            rumpun_mk: rumpun_mk || '',
            pengembang_rps: pengembang_rps || req.user?.nama_lengkap || '',
            koordinator_rumpun_mk: koordinator_rumpun_mk || '',
            ketua_prodi: ketua_prodi || '',
            pustaka_utama: req.body.pustaka_utama || '',
            pustaka_pendukung: req.body.pustaka_pendukung || '',
            media_software: req.body.media_software || '',
            media_hardware: req.body.media_hardware || '',
            dosen_pengampu_list: req.body.dosen_pengampu_list || [],
            mk_syarat: req.body.mk_syarat || '',
            ambang_batas_mhs: req.body.ambang_batas_mhs || '',
            ambang_batas_mk: req.body.ambang_batas_mk || '',
            cpl_ids: req.body.cpl_ids || [],
            cpmk_ids: req.body.cpmk_ids || [],
            dosen_id: req.user.id,  // Use User ID directly
            status: 'draft',
            sub_cpmk_list: req.body.sub_cpmk_list || [],
            revision: 1
        });

        console.log('RPS created successfully:', rps.id);

        const rpsWithInclusions = await resolveRPSInclusions(rps);

        res.status(201).json({
            message: 'RPS created successfully',
            rps: rpsWithInclusions
        });
    } catch (error) {
        console.error('Error creating RPS:', error);
        res.status(500).json({
            message: 'Failed to create RPS',
            error: error.message,
            details: error.errors?.map(e => e.message) || []
        });
    }
};

/**
 * Create a new revision from an existing RPS
 * POST /api/rps/dosen/:rpsId/revise
 */
export const createRevision = async (req, res) => {
    try {
        const { rpsId } = req.params;
        const user = req.user;

        const oldRps = await RPS.findByPk(rpsId, {
            include: [{ model: RPSPertemuan, as: 'pertemuan' }]
        });

        if (!oldRps) {
            return res.status(404).json({ message: 'Original RPS not found' });
        }

        // Check permission: Owner or Kaprodi
        const isOwner = oldRps.dosen_id === user.id;
        const canRevise = isOwner || ['kaprodi', 'dekan'].includes(user.role);

        if (!canRevise) {
            return res.status(403).json({ message: 'You do not have permission to create a revision for this RPS' });
        }

        // Check if there is already a draft revision (to prevent multiple parallel drafts)
        const existingDraft = await RPS.findOne({
            where: {
                mata_kuliah_id: oldRps.mata_kuliah_id,
                semester: oldRps.semester,
                tahun_ajaran: oldRps.tahun_ajaran,
                status: 'draft',
                revision: { [Op.gt]: oldRps.revision }
            }
        });

        if (existingDraft) {
            return res.status(400).json({
                message: 'A draft revision already exists. Please finish or delete it first.',
                rps: existingDraft
            });
        }

        // Create new revision
        const newRevision = oldRps.revision + 1;
        const newRps = await RPS.create({
            mata_kuliah_id: oldRps.mata_kuliah_id,
            assignment_id: oldRps.assignment_id,
            dosen_id: user.id, // The creator of revision becomes owner (usually same person)
            is_template: oldRps.is_template,
            template_id: oldRps.template_id,
            semester: oldRps.semester,
            tahun_ajaran: oldRps.tahun_ajaran,
            semester_akademik: oldRps.semester_akademik,
            jumlah_pertemuan: oldRps.jumlah_pertemuan,
            capaian_pembelajaran: oldRps.capaian_pembelajaran,
            deskripsi_mk: oldRps.deskripsi_mk,
            referensi: oldRps.referensi,
            rumpun_mk: oldRps.rumpun_mk,
            pengembang_rps: oldRps.pengembang_rps,
            koordinator_rumpun_mk: oldRps.koordinator_rumpun_mk,
            ketua_prodi: oldRps.ketua_prodi,
            pustaka_utama: oldRps.pustaka_utama,
            pustaka_pendukung: oldRps.pustaka_pendukung,
            media_software: oldRps.media_software,
            media_hardware: oldRps.media_hardware,
            dosen_pengampu_list: oldRps.dosen_pengampu_list,
            mk_syarat: oldRps.mk_syarat,
            ambang_batas_mhs: oldRps.ambang_batas_mhs,
            ambang_batas_mk: oldRps.ambang_batas_mk,
            cpl_ids: oldRps.cpl_ids,
            cpmk_ids: oldRps.cpmk_ids,
            status: 'draft',
            sub_cpmk_list: oldRps.sub_cpmk_list || [],
            revision: newRevision
        });

        // Clone pertemuan
        if (oldRps.pertemuan && oldRps.pertemuan.length > 0) {
            const pertemuanData = oldRps.pertemuan.map(p => ({
                rps_id: newRps.id,
                minggu_ke: p.minggu_ke,
                sampai_minggu_ke: p.sampai_minggu_ke, // Added
                sub_cpmk: p.sub_cpmk,
                sub_cpmk_id: p.sub_cpmk_id, // Clone ID
                indikator: p.indikator,
                materi: p.materi,
                metode_pembelajaran: p.metode_pembelajaran,
                bentuk_pembelajaran: p.bentuk_pembelajaran,
                link_daring: p.link_daring,
                bentuk_evaluasi: p.bentuk_evaluasi,
                bobot_penilaian: p.bobot_penilaian
            }));
            await RPSPertemuan.bulkCreate(pertemuanData);
        }

        res.status(201).json({
            message: `Revision ${newRevision} created successfully`,
            rps: newRps
        });

    } catch (error) {
        console.error('Error creating revision:', error);
        res.status(500).json({ message: 'Failed to create revision', error: error.message });
    }
};

/**
 * Update RPS (Dosen only, if status = Draft)
 */
export const updateRPS = async (req, res) => {
    try {
        const { rpsId } = req.params;
        console.log('=== UPDATE RPS REQUEST ===');
        console.log('RPS ID:', rpsId);
        console.log('User ID:', req.user?.id, 'Role:', req.user?.role);
        console.log('Request body keys:', Object.keys(req.body));

        const {
            deskripsi_mk,
            rumpun_mk,
            pengembang_rps,
            koordinator_rumpun_mk,
            ketua_prodi,
            referensi,
            cpl_ids,
            cpmk_ids,
            sub_cpmk_list,
            pustaka_utama,
            pustaka_pendukung,
            media_software,
            media_hardware,
            dosen_pengampu_list,
            mk_syarat,
            ambang_batas_mhs,
            ambang_batas_mk,
            metode_penilaian // Add this
        } = req.body;

        const rps = await RPS.findByPk(rpsId);
        if (!rps) {
            console.log('RPS not found:', rpsId);
            return res.status(404).json({ message: 'RPS not found', rpsId });
        }

        console.log('Found RPS:', { id: rps.id, dosen_id: rps.dosen_id, status: rps.status });

        // Check ownership - kaprodi/dekan can always edit, dosen can only edit their own
        const isOwner = rps.dosen_id === req.user.id;
        const isAdmin = ['kaprodi', 'dekan', 'admin_institusi'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            console.log('Access denied - user:', req.user.id, 'rps owner:', rps.dosen_id);
            return res.status(403).json({
                message: 'Access denied - you do not own this RPS',
                yourId: req.user.id,
                ownerId: rps.dosen_id
            });
        }

        // Allow editing draft, rejected, or pending status
        const editableStatuses = ['draft', 'rejected', 'pending'];
        if (!editableStatuses.includes(rps.status) && !isAdmin) {
            console.log('Cannot edit RPS with status:', rps.status);
            return res.status(400).json({
                message: `Cannot update RPS with status "${rps.status}". Only draft/rejected/pending RPS can be edited.`,
                currentStatus: rps.status
            });
        }

        // Build update object, only including non-undefined values
        const updateData = {};
        if (deskripsi_mk !== undefined) updateData.deskripsi_mk = deskripsi_mk;
        if (rumpun_mk !== undefined) updateData.rumpun_mk = rumpun_mk;
        if (pengembang_rps !== undefined) updateData.pengembang_rps = pengembang_rps;
        if (koordinator_rumpun_mk !== undefined) updateData.koordinator_rumpun_mk = koordinator_rumpun_mk;
        if (ketua_prodi !== undefined) updateData.ketua_prodi = ketua_prodi;
        if (referensi !== undefined) updateData.referensi = referensi;
        if (pustaka_utama !== undefined) updateData.pustaka_utama = pustaka_utama;
        if (pustaka_pendukung !== undefined) updateData.pustaka_pendukung = pustaka_pendukung;
        if (media_software !== undefined) updateData.media_software = media_software;
        if (media_hardware !== undefined) updateData.media_hardware = media_hardware;
        if (dosen_pengampu_list !== undefined) updateData.dosen_pengampu_list = dosen_pengampu_list;
        if (mk_syarat !== undefined) updateData.mk_syarat = mk_syarat;
        if (ambang_batas_mhs !== undefined) updateData.ambang_batas_mhs = ambang_batas_mhs;
        if (ambang_batas_mk !== undefined) updateData.ambang_batas_mk = ambang_batas_mk;
        if (cpl_ids !== undefined) updateData.cpl_ids = cpl_ids;
        if (cpmk_ids !== undefined) updateData.cpmk_ids = cpmk_ids;
        if (sub_cpmk_list !== undefined) updateData.sub_cpmk_list = sub_cpmk_list;
        if (metode_penilaian !== undefined) updateData.metode_penilaian = metode_penilaian; // Add this
        updateData.updated_at = new Date();

        console.log('Updating RPS with data keys:', Object.keys(updateData));

        await rps.update(updateData);

        console.log('RPS updated successfully');

        res.json({
            message: 'RPS updated successfully',
            rps: await resolveRPSInclusions(rps)
        });
    } catch (error) {
        console.error('Error updating RPS:', error);
        res.status(500).json({
            message: 'Failed to update RPS',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * Bulk create/update pertemuan for an RPS
 */
export const bulkUpsertPertemuan = async (req, res) => {
    try {
        const { rpsId } = req.params;
        const { pertemuan } = req.body; // Array of pertemuan objects

        if (!Array.isArray(pertemuan)) {
            return res.status(400).json({ message: 'pertemuan must be an array' });
        }

        console.log(`[bulkUpsertPertemuan] Saving ${pertemuan.length} items for RPS ${rpsId}`);

        const rps = await RPS.findByPk(rpsId);
        if (!rps) {
            return res.status(404).json({ message: 'RPS not found' });
        }

        // Check ownership or permission
        const isOwner = rps.dosen_id === req.user.id;
        const canEdit = isOwner || ['kaprodi', 'dekan', 'admin'].includes(req.user.role);

        if (!canEdit) {
            console.log(`[bulkUpsertPertemuan] Permission denied for user ${req.user.id} (${req.user.role}) on RPS ${rpsId}`);
            return res.status(403).json({ message: 'You do not have permission to edit this RPS' });
        }

        // Can only edit if Draft
        if (rps.status && rps.status.toLowerCase() !== 'draft') {
            return res.status(400).json({
                message: 'Can only edit RPS in Draft status'
            });
        }

        console.log('[DEBUG] Start bulkUpsert. Pertemuan count:', pertemuan?.length);

        // --- NEW LOGIC: Delete orphaned rows ---
        console.log('[DEBUG] filtering keepingIds...');
        const keepingIds = pertemuan
            .map(p => p.id)
            .filter(id => id && !String(id).startsWith('new-') && !String(id).includes('temp') && !isNaN(parseInt(id)) && Number.isInteger(Number(id)) && !String(id).includes('-'));

        console.log('[DEBUG] keepingIds:', keepingIds);

        if (keepingIds.length > 0) {
            console.log('[DEBUG] destroying orphans (notIn keepingIds)...');
            await RPSPertemuan.destroy({
                where: {
                    rps_id: rpsId,
                    id: { [Op.notIn]: keepingIds }
                }
            });
        } else if (pertemuan.length > 0) {
            console.log('[DEBUG] destroying all (no valid IDs kept)...');
            await RPSPertemuan.destroy({
                where: { rps_id: rpsId }
            });
        }
        // ----------------------------------------

        const results = [];
        console.log('[DEBUG] Starting loop...');

        for (const item of pertemuan) {
            const {
                minggu_ke,
                sampai_minggu_ke, // Add this
                sub_cpmk,
                sub_cpmk_id, // Add this
                indikator,
                materi,
                metode_pembelajaran,
                bentuk_pembelajaran,
                link_daring,
                bentuk_evaluasi,
                bobot_penilaian,
                is_uts, // Extract these flags
                is_uas
            } = item;

            // Determine jenis_pertemuan
            let jenis_pertemuan = 'regular';
            if (is_uts) jenis_pertemuan = 'uts';
            else if (is_uas) jenis_pertemuan = 'uas';

            // Sanitize minggu_ke to integer (handle strings like "1" or "1-2" if leaked)
            let weekNum = parseInt(minggu_ke, 10);
            if (isNaN(weekNum)) {
                // Try to recover from "1-2" style string if frontend sent it raw
                if (typeof minggu_ke === 'string' && minggu_ke.includes('-')) {
                    weekNum = parseInt(minggu_ke.split('-')[0], 10);
                }
            }
            if (isNaN(weekNum)) {
                console.log(`[bulkUpsertPertemuan] Error: Invalid week number "${minggu_ke}"`);
                continue; // Skip invalid rows
            }

            // Sanitize bobot_penilaian to integer
            const sanitizedBobot = bobot_penilaian ? parseInt(bobot_penilaian, 10) : null;
            if (isNaN(sanitizedBobot)) {
                console.log(`[bulkUpsertPertemuan] Warning: bobot_penilaian "${bobot_penilaian}" is not a valid number for week ${minggu_ke}`);
            }

            console.log(`[bulkUpsertPertemuan] Processing week ${minggu_ke}:`, {
                sub_cpmk: sub_cpmk?.substring?.(0, 30) || sub_cpmk,
                materi: materi?.substring?.(0, 30) || materi,
                bobot_penilaian: sanitizedBobot
            });


            // Handle mapping: resolve full text from sub_cpmk_list if only ID is provided
            let subCpmkValue = sub_cpmk;
            if (!subCpmkValue && sub_cpmk_id && rps.sub_cpmk_list) {
                const sub = rps.sub_cpmk_list.find(s => s.id == sub_cpmk_id || s.id === String(sub_cpmk_id));
                if (sub) {
                    subCpmkValue = `${sub.kode || sub.id}: ${sub.deskripsi}`;
                }
            }
            if (!subCpmkValue) subCpmkValue = sub_cpmk_id; // Fallback to ID if still nothing

            try {
                // Determine if we should Update by ID or Create New
                // STRICT CHECK: ID must be a number (positive integer). Strings like "uts-..." or "new-..." are NOT existing IDs.
                const isExistingId = item.id &&
                    !String(item.id).startsWith('new-') &&
                    !String(item.id).includes('temp') &&
                    !String(item.id).includes('uts-') &&
                    !String(item.id).includes('uas-') &&
                    !isNaN(parseInt(item.id)) &&
                    Number.isInteger(Number(item.id));

                if (isExistingId) {
                    // Update existing row
                    await RPSPertemuan.update({
                        minggu_ke: weekNum,
                        sampai_minggu_ke,
                        sub_cpmk: subCpmkValue,
                        sub_cpmk_id,
                        indikator,
                        materi,
                        metode_pembelajaran: Array.isArray(metode_pembelajaran) ? JSON.stringify(metode_pembelajaran) : metode_pembelajaran,
                        bentuk_pembelajaran: Array.isArray(bentuk_pembelajaran) ? bentuk_pembelajaran : [],
                        link_daring,
                        bentuk_evaluasi,
                        bobot_penilaian: sanitizedBobot
                    }, {
                        where: {
                            id: item.id,
                            rps_id: rpsId // Extra safety
                        }
                    });

                    // Fetch updated record to return
                    record = await RPSPertemuan.findOne({ where: { id: item.id } });

                } else {
                    // Create new row
                    // Handle potential UNIQUE constraint collision if 'minggu_ke' is already taken (and wasn't deleted)
                    // We try to find first to be safe, or just upsert-like logic
                    const existingAtWeek = await RPSPertemuan.findOne({
                        where: { rps_id: rpsId, minggu_ke: weekNum }
                    });

                    const payloadIdx = {
                        rps_id: rpsId,
                        minggu_ke: weekNum,
                        sampai_minggu_ke,
                        sub_cpmk: subCpmkValue,
                        sub_cpmk_id,
                        indikator,
                        materi,
                        metode_pembelajaran: Array.isArray(metode_pembelajaran) ? JSON.stringify(metode_pembelajaran) : metode_pembelajaran,
                        bentuk_pembelajaran: Array.isArray(bentuk_pembelajaran) ? bentuk_pembelajaran : [],
                        link_daring,
                        bentuk_evaluasi,
                        bobot_penilaian: sanitizedBobot
                    };

                    if (existingAtWeek) {
                        // Collision! Update the occupier
                        await existingAtWeek.update(payloadIdx);
                        record = existingAtWeek;
                    } else {
                        // Safe to create
                        record = await RPSPertemuan.create(payloadIdx);
                    }
                }

                if (record) results.push(record);

            } catch (innerErr) {
                console.error(`[bulkUpsertPertemuan] Row Error (Week ${weekNum}):`, innerErr.message);
                // Don't throw, just log. We want partial success if possible.
            }
        } // End loop

        res.json({
            message: `${results.length} pertemuan records saved`,
            pertemuan: results
        });
    } catch (error) {
        console.error('Error bulk upserting pertemuan:', error);
        res.status(500).json({ message: 'Failed to save pertemuan', error: error.message });
    }
};

/**
 * Submit RPS for approval
 * POST /api/rps/dosen/:rpsId/submit
 */
export const submitRPS = async (req, res) => {
    try {
        const { rpsId } = req.params;
        const user = req.user;

        const rps = await RPS.findByPk(rpsId, {
            include: [{ model: MataKuliah, as: 'mata_kuliah' }]
        });

        if (!rps) {
            return res.status(404).json({ message: 'RPS not found' });
        }

        // Check ownership
        if (rps.dosen_id !== user.id && !['kaprodi', 'dekan'].includes(user.role)) {
            return res.status(403).json({ message: 'You do not have permission to submit this RPS' });
        }

        // Update status
        rps.status = 'submitted';
        await rps.save();

        // Notify Kaprodi
        try {
            const kaprodi = await User.findOne({
                where: { prodi_id: rps.mata_kuliah.prodi_id, role: 'kaprodi' }
            });

            if (kaprodi) {
                await Notification.create({
                    user_id: kaprodi.id,
                    title: 'RPS Baru Diajukan',
                    message: `Dosen ${user.nama_lengkap} telah mengajukan RPS untuk mata kuliah ${rps.mata_kuliah.nama_mk} (Revisi ${rps.revision}).`,
                    type: 'info',
                    link: `/kaprodi/rps/${rps.mata_kuliah_id}`
                });
            }
        } catch (notifErr) {
            console.error('Failed to notify kaprodi of submission:', notifErr);
        }

        res.json({ message: 'RPS submitted for approval', rps });
    } catch (error) {
        console.error('Submit RPS error:', error);
        res.status(500).json({ message: 'Failed to submit RPS' });
    }
};

/**
 * Approve RPS (Kaprodi/Dekan only)
 * POST /api/rps/kaprodi/:rpsId/approve
 */
export const approveRPS = async (req, res) => {
    try {
        const { rpsId } = req.params;
        const { catatan } = req.body;
        const user = req.user;

        const rps = await RPS.findByPk(rpsId, {
            include: [{ model: MataKuliah, as: 'mata_kuliah' }]
        });

        if (!rps) {
            return res.status(404).json({ message: 'RPS not found' });
        }

        // Check permission
        if (!['kaprodi', 'dekan'].includes(user.role)) {
            return res.status(403).json({ message: 'Only Kaprodi or Dekan can approve RPS' });
        }

        // Update status
        rps.status = 'approved';
        rps.approved_by = user.id;
        rps.approved_at = new Date();
        if (catatan) rps.catatan_approval = catatan;
        await rps.save();

        // Notify Dosen
        try {
            await Notification.create({
                user_id: rps.dosen_id,
                title: 'RPS Disetujui',
                message: `RPS Anda untuk mata kuliah ${rps.mata_kuliah.nama_mk} telah disetujui oleh ${user.nama_lengkap}.`,
                type: 'success',
                link: `/dosen/courses`
            });
        } catch (notifErr) {
            console.error('Failed to notify dosen of approval:', notifErr);
        }

        res.json({ message: 'RPS approved successfully', rps });
    } catch (error) {
        console.error('Approve RPS error:', error);
        res.status(500).json({ message: 'Failed to approve RPS' });
    }
};

/**
 * Get courses for RPS creation dropdown
 * - Dosen: Get courses in their prodi
 * - Kaprodi: Get all courses in their prodi
 */
export const getDosenCourses = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: Prodi, as: 'prodi' }]
        });

        if (!user.prodi_id) {
            return res.status(404).json({ message: 'User has no prodi assigned' });
        }

        // Get all courses in user's prodi
        const courses = await MataKuliah.findAll({
            where: { prodi_id: user.prodi_id },
            order: [['kode_mk', 'ASC']]
        });

        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Failed to fetch courses' });
    }
};

/**
 * Create new CPMK (Dosen/Kaprodi)
 * POST /api/rps/curriculum/cpmk
 */
export const createCPMK = async (req, res) => {
    try {
        const { mata_kuliah_id, cpl_id, kode_cpmk, deskripsi, is_template } = req.body;

        const cpmk = await CPMK.create({
            mata_kuliah_id,
            cpl_id,
            kode_cpmk,
            deskripsi,
            is_template: is_template || false,
            created_by: req.user.id
        });

        res.status(201).json(cpmk);
    } catch (error) {
        console.error('Error creating CPMK:', error);
        res.status(500).json({ message: 'Failed to create CPMK', error: error.message });
    }
};

/**
 * Create new Sub-CPMK
 * POST /api/rps/curriculum/sub-cpmk
 */
export const createSubCPMK = async (req, res) => {
    try {
        const { cpmk_id, kode, deskripsi } = req.body;

        const subCpmk = await SubCPMK.create({
            cpmk_id,
            kode,
            deskripsi
        });

        res.status(201).json(subCpmk);
    } catch (error) {
        console.error('Error creating Sub-CPMK:', error);
        res.status(500).json({ message: 'Failed to create Sub-CPMK', error: error.message });
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
