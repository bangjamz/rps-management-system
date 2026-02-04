import {
    GradingSystem,
    GradeScale,
    GradeScaleDetail,
    AssessmentComponent,
    StudentGrade,
    FinalGrade,
    Prodi,
    MataKuliah,
    SubCPMK,
    Mahasiswa,
    User
} from '../models/index.js';

/**
 * Get grading system configuration for a prodi/semester/tahun
 */
export const getGradingConfig = async (req, res) => {
    try {
        const { prodiId, semester, tahunAjaran } = req.query;

        if (!prodiId || !semester || !tahunAjaran) {
            return res.status(400).json({ message: 'prodiId, semester, and tahunAjaran are required' });
        }

        const config = await GradingSystem.findOne({
            where: {
                prodi_id: prodiId,
                semester,
                tahun_ajaran: tahunAjaran,
                is_active: true
            },
            include: [
                {
                    model: GradeScale,
                    as: 'gradeScale',
                    include: [
                        {
                            model: GradeScaleDetail,
                            as: 'details',
                            order: [['sort_order', 'ASC']]
                        }
                    ]
                }
            ]
        });

        if (!config) {
            return res.status(404).json({
                message: 'No grading configuration found for this prodi/semester/year',
                suggestion: 'Please create a grading configuration first'
            });
        }

        res.json(config);
    } catch (error) {
        console.error('Error fetching grading config:', error);
        res.status(500).json({ message: 'Failed to fetch grading configuration' });
    }
};

/**
 * Create or update grading system configuration
 */
export const setGradingConfig = async (req, res) => {
    try {
        const { prodi_id, semester, tahun_ajaran, system_type, grade_scale_id } = req.body;

        // Validation
        if (!prodi_id || !semester || !tahun_ajaran || !system_type || !grade_scale_id) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if config already exists
        const existing = await GradingSystem.findOne({
            where: { prodi_id, semester, tahun_ajaran }
        });

        let config;
        if (existing) {
            // Update existing
            await existing.update({ system_type, grade_scale_id });
            config = existing;
        } else {
            // Create new
            config = await GradingSystem.create({
                prodi_id,
                semester,
                tahun_ajaran,
                system_type,
                grade_scale_id
            });
        }

        // Fetch with associations
        const result = await GradingSystem.findByPk(config.id, {
            include: [
                {
                    model: GradeScale,
                    as: 'gradeScale',
                    include: [{ model: GradeScaleDetail, as: 'details' }]
                }
            ]
        });

        res.json(result);
    } catch (error) {
        console.error('Error setting grading config:', error);
        res.status(500).json({ message: 'Failed to set grading configuration' });
    }
};

/**
 * Get all available grade scales
 */
export const getGradeScales = async (req, res) => {
    try {
        const scales = await GradeScale.findAll({
            where: { is_active: true },
            include: [
                {
                    model: GradeScaleDetail,
                    as: 'details',
                    order: [['sort_order', 'ASC']]
                }
            ]
        });

        res.json(scales);
    } catch (error) {
        console.error('Error fetching grade scales:', error);
        res.status(500).json({ message: 'Failed to fetch grade scales' });
    }
};

/**
 * Convert nilai_angka to huruf and IP using a grade scale
 */
export const convertGrade = (nilaiAngka, gradeScaleDetails) => {
    const detail = gradeScaleDetails.find(
        d => nilaiAngka >= d.min_angka && nilaiAngka <= d.max_angka
    );

    if (!detail) {
        // Fallback for edge cases
        if (nilaiAngka > 100) return { huruf: 'A', ip: gradeScaleDetails[0].ip };
        if (nilaiAngka < 0) return { huruf: 'E', ip: 0.0 };
        return { huruf: 'E', ip: 0.0 };
    }

    return { huruf: detail.huruf, ip: detail.ip };
};
