import { CPMK, CPL, Prodi } from './models/index.js';
import sequelize from './config/database.js';
import { Op } from 'sequelize';

// Transcribed from uploaded images (Partial set for demo/testing)
// Note: Mapped CPL01 -> to DB code IF-CPL01
const cpmkSource = [
    // CPL01
    { code: 'CPMK011', cpl: 'CPL01', deskripsi: 'Mengembangkan pemahaman dan penghargaan terhadap ajaran agama dalam konteks global.' },
    { code: 'CPMK012', cpl: 'CPL01', deskripsi: 'Memahami dan mengaplikasikan nilai-nilai Pancasila dalam kehidupan bermasyarakat dan bernegara.' },
    { code: 'CPMK013', cpl: 'CPL01', deskripsi: 'Memperdalam pengetahuan dan praktik agama serta etika dalam kehidupan sehari-hari.' },
    { code: 'CPMK014', cpl: 'CPL01', deskripsi: 'Mengembangkan komunikasi efektif yang menghormati keragaman budaya dan agama.' },
    { code: 'CPMK015', cpl: 'CPL01', deskripsi: 'Menerapkan prinsip etika profesional yang berlandaskan nilai agama dalam lingkungan kerja.' },
    { code: 'CPMK016', cpl: 'CPL01', deskripsi: 'Memahami dan menghormati hukum serta kebijakan yang berlaku dengan mempertimbangkan nilai religius.' },
    // CPL02
    { code: 'CPMK021', cpl: 'CPL02', deskripsi: 'Mengembangkan keterampilan menulis ilmiah dan menyajikan ide dengan cara mandiri.' },
    { code: 'CPMK022', cpl: 'CPL02', deskripsi: 'Menerapkan prinsip kewirausahaan dalam proyek dan inisiatif teknologi informasi.' },
    { code: 'CPMK023', cpl: 'CPL02', deskripsi: 'Menerapkan pendekatan kreatif dan mandiri dalam desain dan pengembangan grafis digital.' },
    { code: 'CPMK024', cpl: 'CPL02', deskripsi: 'Mengembangkan solusi inovatif untuk keamanan data dengan pendekatan yang mandiri.' },
    { code: 'CPMK025', cpl: 'CPL02', deskripsi: 'Memperlihatkan kemandirian dalam memecahkan masalah etis dan profesional dalam bidang IT.' },
    { code: 'CPMK026', cpl: 'CPL02', deskripsi: 'Mengembangkan dan menerapkan strategi komunikasi interpersonal yang efektif dalam lingkungan kerja yang beragam.' },
    { code: 'CPMK027', cpl: 'CPL02', deskripsi: 'Melakukan analisis kritis terhadap kebijakan dan hukum IT dengan pandangan yang mandiri dan kritis.' },
    { code: 'CPMK028', cpl: 'CPL02', deskripsi: 'Menyelesaikan proyek akhir dengan pendekatan yang mandiri, menunjukkan kemampuan analisis dan sintesis.' },
    // CPL03
    { code: 'CPMK031', cpl: 'CPL03', deskripsi: 'Memahami prinsip dasar ilmu komputer, termasuk cara kerja sistem dan algoritma.' },
    { code: 'CPMK032', cpl: 'CPL03', deskripsi: 'Menerapkan teknik pemrograman untuk pengembangan aplikasi dan solusi IT.' },
    { code: 'CPMK033', cpl: 'CPL03', deskripsi: 'Menganalisis dan mengelola data menggunakan metode statistik dan komputasi.' },
    { code: 'CPMK034', cpl: 'CPL03', deskripsi: 'Mengintegrasikan teknologi terkini seperti cloud computing, big data, dan IoT dalam solusi IT.' },
    { code: 'CPMK035', cpl: 'CPL03', deskripsi: 'Memahami dan menerapkan prinsip keamanan data dan informasi dalam sistem komputer dan jaringan.' },
    { code: 'CPMK036', cpl: 'CPL03', deskripsi: 'Mengembangkan keterampilan manajemen proyek dan riset operasional dalam konteks teknologi informasi.' },
    // CPL04
    { code: 'CPMK041', cpl: 'CPL04', deskripsi: 'Menerapkan algoritma dan teknik pemrograman untuk menyelesaikan masalah kompleks.' },
    { code: 'CPMK042', cpl: 'CPL04', deskripsi: 'Menggunakan prinsip matematika diskrit dan logika untuk menganalisis masalah dan mengembangkan solusi.' },
    { code: 'CPMK043', cpl: 'CPL04', deskripsi: 'Menerapkan konsep dan teori dari ilmu komputer untuk memahami dan menyelesaikan masalah teknologi informasi.' },
    { code: 'CPMK044', cpl: 'CPL04', deskripsi: 'Mengelola dan menganalisis data besar menggunakan metode dan teknik canggih dalam komputasi.' },
    { code: 'CPMK045', cpl: 'CPL04', deskripsi: 'Merancang dan mengimplementasikan solusi infrastruktur TI seperti cloud computing dan jaringan komputer.' },
    { code: 'CPMK046', cpl: 'CPL04', deskripsi: 'Menerapkan prinsip rekayasa perangkat lunak dan analisis desain dalam pengembangan solusi teknologi informasi.' },
    { code: 'CPMK047', cpl: 'CPL04', deskripsi: 'Mengintegrasikan teknologi terkini seperti IoT dan keamanan data dalam solusi IT, dengan mempertimbangkan perkembangan ilmu baru.' },
    { code: 'CPMK048', cpl: 'CPL04', deskripsi: 'Mengembangkan keterampilan manajemen proyek dan riset operasional untuk memimpin dan mengevaluasi proyek TI.' },
    // CPL05
    { code: 'CPMK051', cpl: 'CPL05', deskripsi: 'Menerapkan prinsip algoritma dan struktur data dalam desain aplikasi multi-platform.' },
    { code: 'CPMK052', cpl: 'CPL05', deskripsi: 'Memahami dan menerapkan konsep matematika dan logika informatika dalam pengembangan solusi IT.' }
];

const seed = async () => {
    try {
        console.log('Connecting to database...');
        // Find Prodi
        const prodi = await Prodi.findOne({
            where: { nama: { [Op.like]: '%Informatika%' } }
        });
        if (!prodi) { console.error('Prodi not found'); process.exit(1); }

        // Find CPLs
        const cpls = await CPL.findAll({
            where: { prodi_id: prodi.id }
        });

        // Map "CPLxx" -> ID
        // DB codes are "IF-CPLxx".
        const cplMap = {};
        cpls.forEach(c => {
            // Extract suffix from IF-CPL01 -> CPL01
            // or just match based on suffix
            const match = c.kode_cpl.match(/CPL(\d+)$/);
            if (match) {
                const suffix = match[1]; // "01"
                cplMap[`CPL${suffix}`] = c.id;
            }
        });

        // Prepare CPMKs
        const cpmksToCreate = [];
        for (const item of cpmkSource) {
            const cplId = cplMap[item.cpl];
            if (!cplId) {
                console.warn(`Skipping ${item.code}: CPL ${item.cpl} not found in DB`);
                continue;
            }

            cpmksToCreate.push({
                kode_cpmk: `IF-${item.code}`, // Make unique: IF-CPMK011
                deskripsi: item.deskripsi,
                cpl_id: cplId,
                // is_active: true (default)
            });
        }

        // Delete existing CPMKs for these CPLs?
        // Or just Delete all CPMKs for this prodi's CPLs
        const cplIds = cpls.map(c => c.id);
        await CPMK.destroy({
            where: { cpl_id: { [Op.in]: cplIds } }
        });
        console.log('Deleted existing CPMKs for Informatika');

        await CPMK.bulkCreate(cpmksToCreate);
        console.log(`Successfully seeded ${cpmksToCreate.length} CPMKs for Informatika`);

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
};

seed();
