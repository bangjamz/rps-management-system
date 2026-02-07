/**
 * CSV Template Generator and Parser for Bulk Import
 * Supports CPL, CPMK, and Sub-CPMK
 */

/**
 * Generate CSV template for download
 * @param {string} type - 'cpl', 'cpmk', or 'sub-cpmk'
 * @returns {string} CSV content
 */
export const generateCSVTemplate = (type, userUnit = '') => {
    const templates = {
        cpl: {
            headers: ['kode_cpl', 'deskripsi', 'keterangan', 'kategori', 'level', 'unit_name'],
            example: ['CPL01', 'Bertakwa kepada Tuhan Yang Maha Esa...', 'S01', 'Sikap', 'prodi', userUnit || 'Informatika'],
        },
        cpmk: {
            headers: ['kode_cpmk', 'deskripsi', 'kode_cpl', 'kode_mk', 'level', 'unit_name'],
            example: ['CPMK011', 'Mengembangkan pemahaman...', 'CPL01', 'MK38', 'prodi', userUnit || 'Informatika'],
        },
        'sub-cpmk': {
            headers: ['kode_sub_cpmk', 'deskripsi', 'kode_cpmk', 'kode_mk', 'bobot_persen', 'level', 'unit_name'],
            example: ['SUBCPMK0111', 'Memahami konsep dasar...', 'CPMK011', 'MK38', '50', 'prodi', userUnit || 'Informatika'],
        },
        'bahan-kajian': {
            headers: ['kode_bk', 'jenis', 'deskripsi', 'bobot_min', 'bobot_max', 'level', 'unit_name'],
            example: ['BK01', 'Bahan Kajian...', 'Social Issues...', '2', '4', 'prodi', userUnit || 'Informatika'],
        },
        'mk': {
            headers: ['kode_mk', 'nama_mk', 'sks', 'semester', 'deskripsi', 'sks_teori', 'sks_praktek', 'jenis', 'level', 'unit_name'],
            example: ['MK001', 'Algoritma...', '3', '1', '...', '2', '1', 'Wajib', 'prodi', userUnit || 'Informatika'],
        }
    };

    const template = templates[type];
    if (!template) throw new Error('Invalid template type');

    const csvRows = [
        template.headers.join(','),
        template.example.join(',')
    ];

    return csvRows.join('\n');
};

/**
 * Download CSV template
 * @param {string} type - 'cpl', 'cpmk', or 'sub-cpmk'
 */
export const downloadCSVTemplate = (type, userUnit = '') => {
    const csv = generateCSVTemplate(type, userUnit);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `Template_${type}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Parse CSV file
 * @param {File} file - CSV file
 * @returns {Promise<Array>} Parsed data
 */
export const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const rows = text.split('\n').filter(row => row.trim());

                if (rows.length < 2) {
                    reject(new Error('File CSV kosong atau tidak valid'));
                    return;
                }

                const headers = rows[0].split(',').map(h => h.trim());
                const data = [];

                for (let i = 1; i < rows.length; i++) {
                    const values = rows[i].split(',').map(v => v.trim());
                    if (values.some(v => v)) { // Skip empty rows
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = values[index] || '';
                        });
                        data.push(obj);
                    }
                }

                resolve(data);
            } catch (error) {
                reject(new Error('Gagal memparse CSV: ' + error.message));
            }
        };

        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsText(file);
    });
};

/**
 * Validate and auto-increment codes
 * @param {Array} data - Parsed CSV data
 * @param {string} type - 'cpl', 'cpmk', or 'sub-cpmk'
 * @param {Array} existingData - Existing data from database
 * @returns {Object} { valid: Array, errors: Array }
 */
export const validateAndAutoIncrement = (data, type, existingData = []) => {
    const valid = [];
    const errors = [];

    // Get max code number from existing data
    const getMaxNumber = (prefix) => {
        const numbers = existingData
            .map(item => {
                const code = item[`kode_${type.replace('-', '_')}`];
                if (code && code.startsWith(prefix)) {
                    return parseInt(code.replace(prefix, ''));
                }
                return 0;
            })
            .filter(n => !isNaN(n));

        return numbers.length > 0 ? Math.max(...numbers) : 0;
    };

    data.forEach((row, index) => {
        const rowNum = index + 2; // +2 for header and 0-index
        const errors_row = [];

        // Validation based on type
        if (type === 'cpl') {
            if (!row.kode_cpl) {
                // Auto-generate code
                const nextNum = getMaxNumber('CPL') + valid.length + 1;
                row.kode_cpl = `CPL${String(nextNum).padStart(2, '0')}`;
            }
            if (!row.deskripsi) {
                errors_row.push(`Baris ${rowNum}: Deskripsi wajib diisi`);
            }
            if (!row.kategori) {
                errors_row.push(`Baris ${rowNum}: Kategori wajib diisi`);
            }
        } else if (type === 'cpmk') {
            if (!row.kode_cpmk) {
                // Auto-generate code based on CPL
                const cplNum = row.kode_cpl ? row.kode_cpl.replace('CPL', '') : '01';
                const nextNum = getMaxNumber(`CPMK${cplNum}`) + valid.filter(v => v.kode_cpl === row.kode_cpl).length + 1;
                row.kode_cpmk = `CPMK${cplNum}${nextNum}`;
            }
            if (!row.deskripsi) {
                errors_row.push(`Baris ${rowNum}: Deskripsi wajib diisi`);
            }
            if (!row.kode_cpl) {
                errors_row.push(`Baris ${rowNum}: Kode CPL wajib diisi`);
            }
        } else if (type === 'sub-cpmk') {
            if (!row.kode_sub_cpmk) {
                // Auto-generate code based on CPMK
                const cpmkBase = row.kode_cpmk || 'CPMK011';
                const nextNum = getMaxNumber(cpmkBase) + valid.filter(v => v.kode_cpmk === row.kode_cpmk).length + 1;
                row.kode_sub_cpmk = `${cpmkBase}${nextNum}`;
            }
            if (!row.deskripsi) {
                errors_row.push(`Baris ${rowNum}: Deskripsi wajib diisi`);
            }
            if (!row.kode_cpmk) {
                errors_row.push(`Baris ${rowNum}: Kode CPMK wajib diisi`);
            }
            // Default bobot if not specified
            if (!row.bobot_persen) {
                row.bobot_persen = '10';
            }
        }

        if (errors_row.length === 0) {
            valid.push(row);
        } else {
            errors.push(...errors_row);
        }
    });

    return { valid, errors };
};

/**
 * Export data to CSV
 * @param {Array} data - Data to export
 * @param {string} filename - Output filename
 * @param {Array} headers - CSV headers
 */
export const exportToCSV = (data, filename, headers) => {
    const csvRows = [headers.join(',')];

    data.forEach(item => {
        const values = headers.map(header => {
            const value = item[header];
            // Escape commas and quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
        });
        csvRows.push(values.join(','));
    });

    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
