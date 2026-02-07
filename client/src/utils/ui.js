/**
 * Common UI utility functions for consistent styling across the application.
 */

/**
 * Returns a set of Tailwind CSS classes for consistent tag/badge styling based on content.
 * @param {string} value The text content of the tag.
 * @returns {string} Tailwind CSS classes for background, text, and border.
 */
export const getTagColor = (value) => {
    if (!value) return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';

    const val = value.toLowerCase().trim();

    // Level & Scope (Semantic hierarchy)
    if (val === 'institusi') return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
    if (val === 'fakultas') return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
    if (val === 'prodi') return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';

    // Status Levels
    if (val === 'draft') return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    if (val === 'pending' || val === 'menunggu') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    if (val === 'approved' || val === 'aktif' || val === 'disetujui' || val === 'relevan') return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    if (val === 'rejected' || val === 'non-aktif' || val === 'ditolak' || val === 'tidak aktif') return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';

    // Categories and types (Explicit Mappings)
    const colorMap = [
        { key: 'sikap', class: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
        { key: 'pengetahuan', class: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
        { key: 'umum', class: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
        { key: 'khusus', class: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' },
        { key: 'wajib', class: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' },
        { key: 'pilihan', class: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800' },
        { key: 'same-prodi', class: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800' },
        { key: 'cross-faculty', class: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' },
        { key: 'bidang', class: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800' },
    ];

    for (const entry of colorMap) {
        if (val.includes(entry.key)) return entry.class;
    }

    // Hash-based fallback for any other values to ensure distinct colors
    const dynamicColors = [
        'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800',
        'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800',
        'bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-800',
        'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800',
        'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-800',
        'bg-lime-50 text-lime-600 border-lime-100 dark:bg-lime-950/20 dark:text-lime-400 dark:border-lime-800',
        'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800',
        'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100 dark:bg-fuchsia-950/20 dark:text-fuchsia-400 dark:border-fuchsia-800',
    ];

    let hash = 0;
    for (let i = 0; i < val.length; i++) {
        hash = val.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % dynamicColors.length;
    return dynamicColors[index];
};
