import {
    AssessmentComponent,
    MataKuliah,
    SubCPMK,
    CPMK,
    CPL
} from '../models/index.js';

/**
 * Get assessment components for a course
 */
export const getAssessmentComponents = async (req, res) => {
    try {
        const { mataKuliahId, semester, tahunAjaran } = req.query;

        if (!mataKuliahId) {
            return res.status(400).json({ message: 'mataKuliahId is required' });
        }

        const where = { mata_kuliah_id: mataKuliahId, is_active: true };
        if (semester) where.semester = semester;
        if (tahunAjaran) where.tahun_ajaran = tahunAjaran;

        const components = await AssessmentComponent.findAll({
            where,
            include: [
                {
                    model: SubCPMK,
                    as: 'subCpmk',
                    include: [
                        {
                            model: CPMK,
                            as: 'cpmk',
                            include: [{ model: CPL, as: 'cpl' }]
                        }
                    ]
                }
            ],
            order: [['component_type', 'ASC'], ['createdAt', 'ASC']]
        });

        res.json(components);
    } catch (error) {
        console.error('Error fetching assessment components:', error);
        res.status(500).json({ message: 'Failed to fetch assessment components' });
    }
};

/**
 * Create assessment component (legacy or OBE)
 */
export const createAssessmentComponent = async (req, res) => {
    try {
        const {
            mata_kuliah_id,
            semester,
            tahun_ajaran,
            component_type,
            // Legacy fields
            legacy_type,
            legacy_weight,
            // OBE fields
            sub_cpmk_id,
            pertemuan_range,
            obe_weight,
            description
        } = req.body;

        // Validation
        if (!mata_kuliah_id || !semester || !tahun_ajaran || !component_type) {
            return res.status(400).json({ message: 'Required fields: mata_kuliah_id, semester, tahun_ajaran, component_type' });
        }

        if (component_type === 'legacy' && (!legacy_type || legacy_weight === undefined)) {
            return res.status(400).json({ message: 'Legacy components require legacy_type and legacy_weight' });
        }

        if (component_type === 'obe' && (!sub_cpmk_id || obe_weight === undefined)) {
            return res.status(400).json({ message: 'OBE components require sub_cpmk_id and obe_weight' });
        }

        const component = await AssessmentComponent.create({
            mata_kuliah_id,
            semester,
            tahun_ajaran,
            component_type,
            legacy_type: component_type === 'legacy' ? legacy_type : null,
            legacy_weight: component_type === 'legacy' ? legacy_weight : null,
            sub_cpmk_id: component_type === 'obe' ? sub_cpmk_id : null,
            pertemuan_range: component_type === 'obe' ? pertemuan_range : null,
            obe_weight: component_type === 'obe' ? obe_weight : null,
            description
        });

        // Fetch with associations
        const result = await AssessmentComponent.findByPk(component.id, {
            include: [
                {
                    model: SubCPMK,
                    as: 'subCpmk',
                    include: [
                        {
                            model: CPMK,
                            as: 'cpmk',
                            include: [{ model: CPL, as: 'cpl' }]
                        }
                    ]
                }
            ]
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating assessment component:', error);
        res.status(500).json({ message: 'Failed to create assessment component' });
    }
};

/**
 * Update assessment component
 */
export const updateAssessmentComponent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const component = await AssessmentComponent.findByPk(id);
        if (!component) {
            return res.status(404).json({ message: 'Assessment component not found' });
        }

        await component.update(updates);

        // Fetch with associations
        const result = await AssessmentComponent.findByPk(id, {
            include: [
                {
                    model: SubCPMK,
                    as: 'subCpmk',
                    include: [
                        {
                            model: CPMK,
                            as: 'cpmk',
                            include: [{ model: CPL, as: 'cpl' }]
                        }
                    ]
                }
            ]
        });

        res.json(result);
    } catch (error) {
        console.error('Error updating assessment component:', error);
        res.status(500).json({ message: 'Failed to update assessment component' });
    }
};

/**
 * Delete assessment component
 */
export const deleteAssessmentComponent = async (req, res) => {
    try {
        const { id } = req.params;

        const component = await AssessmentComponent.findByPk(id);
        if (!component) {
            return res.status(404).json({ message: 'Assessment component not found' });
        }

        // Soft delete
        await component.update({ is_active: false });

        res.json({ message: 'Assessment component deleted successfully' });
    } catch (error) {
        console.error('Error deleting assessment component:', error);
        res.status(500).json({ message: 'Failed to delete assessment component' });
    }
};

/**
 * Validate total weight = 100%
 */
export const validateComponentWeights = async (req, res) => {
    try {
        const { mataKuliahId, semester, tahunAjaran } = req.query;

        const components = await AssessmentComponent.findAll({
            where: {
                mata_kuliah_id: mataKuliahId,
                semester,
                tahun_ajaran: tahunAjaran,
                is_active: true
            }
        });

        let totalWeight = 0;
        components.forEach(c => {
            totalWeight += parseFloat(c.component_type === 'legacy' ? c.legacy_weight : c.obe_weight);
        });

        const isValid = Math.abs(totalWeight - 100) < 0.01; // Allow tiny float errors

        res.json({
            total_weight: totalWeight,
            is_valid: isValid,
            component_count: components.length
        });
    } catch (error) {
        console.error('Error validating weights:', error);
        res.status(500).json({ message: 'Failed to validate weights' });
    }
};
