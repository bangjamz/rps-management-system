import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import axios from '../lib/axios';

export default function AssessmentSetupPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [gradingConfig, setGradingConfig] = useState(null);
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingComponent, setEditingComponent] = useState(null);

    const [formData, setFormData] = useState({
        component_type: 'legacy',
        legacy_type: 'UTS',
        legacy_weight: '',
        obe_weight: '',
        sub_cpmk_id: '',
        pertemuan_range: '',
        description: ''
    });

    const semester = 'Ganjil'; // TODO: Get from current semester
    const tahunAjaran = '2025/2026'; // TODO: Get from current year

    useEffect(() => {
        fetchData();
    }, [courseId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch course info
            const courseRes = await axios.get(`/api/courses/${courseId}`);
            setCourse(courseRes.data);

            // Fetch grading config
            const configRes = await axios.get('/api/grading/config', {
                params: {
                    prodiId: courseRes.data.prodi_id,
                    semester,
                    tahunAjaran
                }
            });
            setGradingConfig(configRes.data);

            // Fetch existing components
            const componentsRes = await axios.get('/api/grading/components', {
                params: { mataKuliahId: courseId, semester, tahunAjaran }
            });
            setComponents(componentsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (component = null) => {
        if (component) {
            setEditingComponent(component);
            setFormData({
                component_type: component.component_type,
                legacy_type: component.legacy_type || 'UTS',
                legacy_weight: component.legacy_weight || '',
                obe_weight: component.obe_weight || '',
                sub_cpmk_id: component.sub_cpmk_id || '',
                pertemuan_range: component.pertemuan_range || '',
                description: component.description || ''
            });
        } else {
            setEditingComponent(null);
            setFormData({
                component_type: gradingConfig?.system_type || 'legacy',
                legacy_type: 'UTS',
                legacy_weight: '',
                obe_weight: '',
                sub_cpmk_id: '',
                pertemuan_range: '',
                description: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingComponent(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                mata_kuliah_id: parseInt(courseId),
                semester,
                tahun_ajaran: tahunAjaran,
                ...formData
            };

            if (editingComponent) {
                await axios.put(`/api/grading/components/${editingComponent.id}`, payload);
            } else {
                await axios.post('/api/grading/components', payload);
            }

            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving component:', error);
            alert(error.response?.data?.message || 'Failed to save component');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this component?')) return;
        try {
            await axios.delete(`/api/grading/components/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error deleting component:', error);
        }
    };

    const totalWeight = components.reduce((sum, c) => {
        const weight = c.component_type === 'legacy' ? c.legacy_weight : c.obe_weight;
        return sum + parseFloat(weight || 0);
    }, 0);

    const isValid = Math.abs(totalWeight - 100) < 0.01;

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Assessment Setup</h1>
                    <p className="text-gray-600 mt-1">
                        {course?.kode_mk} - {course?.nama_mk}
                        <span className="ml-2 text-sm">
                            ({gradingConfig?.system_type === 'obe' ? 'OBE Mode' : 'Legacy Mode'})
                        </span>
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Add Component
                </button>
            </div>

            {/* Weight Summary */}
            <div className={`card p-4 ${isValid ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isValid ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                        )}
                        <span className="font-medium">
                            Total Weight: {totalWeight.toFixed(2)}%
                        </span>
                    </div>
                    {isValid ? (
                        <span className="text-sm text-green-700">Ready for grading</span>
                    ) : (
                        <span className="text-sm text-amber-700">Must equal 100%</span>
                    )}
                </div>
            </div>

            {/* Components List */}
            <div className="card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left px-6 py-3 text-sm font-semibold">Component</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold">Type</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold">Weight (%)</th>
                            <th className="text-left px-6 py-3 text-sm font-semibold">Details</th>
                            <th className="text-right px-6 py-3 text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {components.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No components configured. Click "Add Component" to start.
                                </td>
                            </tr>
                        ) : (
                            components.map(comp => (
                                <tr key={comp.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">
                                        {comp.component_type === 'legacy'
                                            ? comp.legacy_type
                                            : `Sub-CPMK ${comp.sub_cpmk_id}`}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${comp.component_type === 'legacy'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-purple-100 text-purple-800'
                                            }`}>
                                            {comp.component_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {comp.component_type === 'legacy' ? comp.legacy_weight : comp.obe_weight}%
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {comp.component_type === 'obe' && comp.pertemuan_range && (
                                            <span>Pertemuan: {comp.pertemuan_range}</span>
                                        )}
                                        {comp.description && (
                                            <div className="text-xs mt-1">{comp.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenModal(comp)}
                                            className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(comp.id)}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
                <button
                    onClick={() => navigate('/dosen/courses')}
                    className="btn btn-secondary"
                >
                    Back to Courses
                </button>
                <button
                    onClick={() => navigate(`/dosen/courses/${courseId}/grades`)}
                    disabled={!isValid}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Proceed to Grading →
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editingComponent ? 'Edit Component' : 'Add Component'}
                            </h2>
                            <button onClick={handleCloseModal}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Component Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Component Type</label>
                                <select
                                    value={formData.component_type}
                                    onChange={(e) => setFormData({ ...formData, component_type: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2"
                                    disabled={!!editingComponent}
                                >
                                    <option value="legacy">Legacy (UTS/UAS/etc.)</option>
                                    <option value="obe">OBE (Sub-CPMK)</option>
                                </select>
                            </div>

                            {formData.component_type === 'legacy' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Assessment Type *</label>
                                        <select
                                            value={formData.legacy_type}
                                            onChange={(e) => setFormData({ ...formData, legacy_type: e.target.value })}
                                            className="w-full border rounded-lg px-4 py-2"
                                            required
                                        >
                                            <option value="UTS">UTS</option>
                                            <option value="UAS">UAS</option>
                                            <option value="Praktikum">Praktikum</option>
                                            <option value="Tugas">Tugas</option>
                                            <option value="Soft Skill">Soft Skill</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Weight (%) *</label>
                                        <input
                                            type="number"
                                            value={formData.legacy_weight}
                                            onChange={(e) => setFormData({ ...formData, legacy_weight: e.target.value })}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="w-full border rounded-lg px-4 py-2"
                                            required
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Sub-CPMK ID *</label>
                                        <input
                                            type="number"
                                            value={formData.sub_cpmk_id}
                                            onChange={(e) => setFormData({ ...formData, sub_cpmk_id: e.target.value })}
                                            className="w-full border rounded-lg px-4 py-2"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Pertemuan Range</label>
                                        <input
                                            type="text"
                                            value={formData.pertemuan_range}
                                            onChange={(e) => setFormData({ ...formData, pertemuan_range: e.target.value })}
                                            placeholder="e.g., 1-3 or 5"
                                            className="w-full border rounded-lg px-4 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Weight (%) *</label>
                                        <input
                                            type="number"
                                            value={formData.obe_weight}
                                            onChange={(e) => setFormData({ ...formData, obe_weight: e.target.value })}
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="w-full border rounded-lg px-4 py-2"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="2"
                                    className="w-full border rounded-lg px-4 py-2"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    {editingComponent ? 'Update' : 'Add'} Component
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
