import { MataKuliah, CPMK, CPL, User, Mahasiswa } from '../models/index.js';
import bcrypt from 'bcryptjs';

// Seed Mata Kuliah dari data mapping
export const seedMataKuliah = async (prodiId, institusiId, fakultasId) => {
    const mkData = [
        // INSTITUSI LEVEL (Scope: Institusi)
        // ----------------------------------------------------------------
        { prodi_id: null, kode_mk: 'MK15', nama_mk: 'Pendidikan Agama', sks: 2, semester: 1, scope: 'institusi' },
        { prodi_id: null, kode_mk: 'MK16', nama_mk: 'Pancasila dan Kewarganegaraan', sks: 2, semester: 1, scope: 'institusi' },
        { prodi_id: null, kode_mk: 'MK17', nama_mk: 'Bahasa Indonesia', sks: 2, semester: 1, scope: 'institusi' },
        { prodi_id: null, kode_mk: 'MK38', nama_mk: 'Bahasa Inggris 1', sks: 2, semester: 1, scope: 'institusi' },
        { prodi_id: null, kode_mk: 'MK51', nama_mk: 'Interpersonal Skill', sks: 2, semester: 5, scope: 'institusi' },
        { prodi_id: null, kode_mk: 'MK55', nama_mk: 'MBKM', sks: 20, semester: 7, scope: 'institusi' },

        // FAKULTAS LEVEL (Scope: Fakultas - e.g., Teknik)
        // ----------------------------------------------------------------
        { prodi_id: null, fakultas_id: fakultasId, kode_mk: 'MK21', nama_mk: 'Kalkulus', sks: 3, semester: 1, scope: 'fakultas' },
        { prodi_id: null, fakultas_id: fakultasId, kode_mk: 'MK20', nama_mk: 'Aljabar Linier', sks: 3, semester: 2, scope: 'fakultas' },
        { prodi_id: null, fakultas_id: fakultasId, kode_mk: 'MK25', nama_mk: 'Statistika', sks: 3, semester: 4, scope: 'fakultas' },

        // PRODI LEVEL (Scope: Prodi - Informatika)
        // ----------------------------------------------------------------
        { prodi_id: prodiId, kode_mk: 'MK01', nama_mk: 'Etika dan Profesi', sks: 2, semester: 3, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK02', nama_mk: 'Hukum dan Kebijakan Teknologi Informasi', sks: 2, semester: 7, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK03', nama_mk: 'Manajemen Proyek Teknologi Informasi', sks: 3, semester: 7, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK04', nama_mk: 'Proyek Software', sks: 3, semester: 6, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK05', nama_mk: 'Struktur Data', sks: 3, semester: 2, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK06', nama_mk: 'Algoritma Pemrograman', sks: 3, semester: 1, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK07', nama_mk: 'Keamanan Data dan Informasi', sks: 3, semester: 5, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK08', nama_mk: 'Rekayasa Perangkat Lunak', sks: 3, semester: 5, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK09', nama_mk: 'Analisis dan Desain Perangkat Lunak', sks: 3, semester: 4, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK10', nama_mk: 'Pemrograman Web', sks: 3, semester: 3, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK11', nama_mk: 'Pembelajaran Mesin', sks: 3, semester: 7, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK12', nama_mk: 'Kecerdasan Buatan', sks: 3, semester: 6, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK13', nama_mk: 'Jaringan Komputer', sks: 3, semester: 4, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK14', nama_mk: 'Pemrograman Berorientasi Objek', sks: 3, semester: 2, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK18', nama_mk: 'Organisasi dan Arsitektur Komputer', sks: 3, semester: 3, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK19', nama_mk: 'Matematika Diskrit', sks: 3, semester: 2, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK22', nama_mk: 'Human-Computer Interaction', sks: 3, semester: 5, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK23', nama_mk: 'Sistem Operasi', sks: 3, semester: 3, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK24', nama_mk: 'Basis Data', sks: 3, semester: 3, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK26', nama_mk: 'Logika Informatika', sks: 3, semester: 2, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK27', nama_mk: 'Cloud Computing 1: Pengantar', sks: 3, semester: 5, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK28', nama_mk: 'Pemrograman Mobile 1', sks: 3, semester: 4, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK30', nama_mk: 'Big Data', sks: 3, semester: 6, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK31', nama_mk: 'Tugas Akhir', sks: 6, semester: 8, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK32', nama_mk: 'Internet of Things', sks: 3, semester: 6, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK33', nama_mk: 'Tata Tulis Ilmiah Komputer dan Informatika', sks: 2, semester: 4, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK34', nama_mk: 'Cloud Computing 2', sks: 3, semester: 6, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK35', nama_mk: 'Big Data 2: Predictive Analysis Lanjutan', sks: 3, semester: 7, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK36', nama_mk: 'Pemrograman Mobile 2', sks: 3, semester: 5, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK37', nama_mk: 'Seminar Tugas Akhir', sks: 2, semester: 7, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK39', nama_mk: 'Pengantar Ilmu Komputer', sks: 3, semester: 1, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK40', nama_mk: 'Digipreneur', sks: 3, semester: 6, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK42', nama_mk: 'Komputer Desain Grafis', sks: 3, semester: 4, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK43', nama_mk: 'Manajemen Teknologi Informasi', sks: 3, semester: 6, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK44', nama_mk: 'Film dan Animasi', sks: 3, semester: 6, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK46', nama_mk: 'Manajemen Sains dan Riset Operasional', sks: 3, semester: 5, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK47', nama_mk: 'Pemasaran Digital', sks: 3, semester: 7, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK48', nama_mk: 'Manajemen Strategik', sks: 3, semester: 7, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK49', nama_mk: 'Rekam Medis Elektronik', sks: 3, semester: 7, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK50', nama_mk: 'Visualisasi Data', sks: 3, semester: 6, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK52', nama_mk: 'E-Government dan Smart City', sks: 3, semester: 7, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK53', nama_mk: 'Analisis Jejaring Sosial', sks: 3, semester: 6, scope: 'prodi' },
        { prodi_id: prodiId, kode_mk: 'MK54', nama_mk: 'Promosi Kesehatan', sks: 2, semester: 7, scope: 'prodi' }
    ];

    const mataKuliah = await MataKuliah.bulkCreate(mkData);
    console.log(`✅ Seeded ${mataKuliah.length} Mata Kuliah`);
    console.log('   - Scope Institusi: 6');
    console.log('   - Scope Fakultas: 3');
    console.log('   - Scope Prodi: 43');
    return mataKuliah;
};

// Seed CPMK Template (dari kurikulum, is_template = true)
export const seedCPMK = async (cplList, mkList) => {
    // Helper function untuk get CPL dan MK ID berdasarkan kode
    const getCPLId = (kodeCPL) => cplList.find(cpl => cpl.kode_cpl === kodeCPL)?.id;
    const getMKId = (kodeMK) => mkList.find(mk => mk.kode_mk === kodeMK)?.id;

    const cpmkData = [
        // CPL01 - CPMK01x
        { kode_cpmk: 'CPMK011', deskripsi: 'Mengembangkan pemahaman dan penghargaan terhadap ajaran agama dalam konteks global.', mata_kuliah_id: getMKId('MK38'), cpl_id: getCPLId('CPL01'), is_template: true },
        { kode_cpmk: 'CPMK012', deskripsi: 'Memahami dan mengaplikasikan nilai-nilai Pancasila dalam kehidupan bermasyarakat dan bernegara.', mata_kuliah_id: getMKId('MK16'), cpl_id: getCPLId('CPL01'), is_template: true },
        { kode_cpmk: 'CPMK013', deskripsi: 'Memperdalam pengetahuan dan praktik agama serta etika dalam kehidupan sehari-hari.', mata_kuliah_id: getMKId('MK15'), cpl_id: getCPLId('CPL01'), is_template: true },
        { kode_cpmk: 'CPMK014', deskripsi: 'Mengembangkan komunikasi efektif yang menghormati keragaman budaya dan agama.', mata_kuliah_id: getMKId('MK17'), cpl_id: getCPLId('CPL01'), is_template: true },
        { kode_cpmk: 'CPMK015', deskripsi: 'Menerapkan prinsip etika profesional yang berlandaskan nilai agama dalam lingkungan kerja.', mata_kuliah_id: getMKId('MK01'), cpl_id: getCPLId('CPL01'), is_template: true },
        { kode_cpmk: 'CPMK016', deskripsi: 'Memahami dan menghormati hukum serta kebijakan yang berlaku dengan mempertimbangkan nilai religius.', mata_kuliah_id: getMKId('MK02'), cpl_id: getCPLId('CPL01'), is_template: true },

        // CPL02 - CPMK02x  
        { kode_cpmk: 'CPMK021', deskripsi: 'Mengembangkan keterampilan menulis ilmiah dan menyajikan ide dengan cara mandiri.', mata_kuliah_id: getMKId('MK33'), cpl_id: getCPLId('CPL02'), is_template: true },
        { kode_cpmk: 'CPMK022', deskripsi: 'Menerapkan prinsip kewirausahaan dalam proyek dan inisiatif teknologi informasi.', mata_kuliah_id: getMKId('MK40'), cpl_id: getCPLId('CPL02'), is_template: true },
        { kode_cpmk: 'CPMK023', deskripsi: 'Menerapkan pendekatan kreatif dan mandiri dalam desain dan pengembangan grafis digital.', mata_kuliah_id: getMKId('MK42'), cpl_id: getCPLId('CPL02'), is_template: true },
        { kode_cpmk: 'CPMK024', deskripsi: 'Mengembangkan solusi inovatif untuk keamanan data dengan pendekatan yang mandiri.', mata_kuliah_id: getMKId('MK31'), cpl_id: getCPLId('CPL02'), is_template: true },
        { kode_cpmk: 'CPMK025', deskripsi: 'Memperlihatkan kemandirian dalam memecahkan masalah etis dan profesional dalam bidang IT.', mata_kuliah_id: getMKId('MK01'), cpl_id: getCPLId('CPL02'), is_template: true },
        { kode_cpmk: 'CPMK026', deskripsi: 'Mengembangkan dan menerapkan strategi komunikasi interpersonal yang efektif dalam lingkungan kerja yang beragam.', mata_kuliah_id: getMKId('MK51'), cpl_id: getCPLId('CPL02'), is_template: true },
        { kode_cpmk: 'CPMK027', deskripsi: 'Melakukan analisis kritis terhadap kebijakan dan hukum TI dengan pandangan yang mandiri dan kritis.', mata_kuliah_id: getMKId('MK02'), cpl_id: getCPLId('CPL02'), is_template: true },
        { kode_cpmk: 'CPMK028', deskripsi: 'Menyelesaikan proyek akhir dengan pendekatan yang mandiri, menunjukkan kemampuan analisis dan sintesis.', mata_kuliah_id: getMKId('MK31'), cpl_id: getCPLId('CPL02'), is_template: true },

        // CPL03 - CPMK03x
        { kode_cpmk: 'CPMK031', deskripsi: 'Memahami prinsip dasar ilmu komputer, termasuk cara kerja sistem dan algoritma.', mata_kuliah_id: getMKId('MK39'), cpl_id: getCPLId('CPL03'), is_template: true },
        { kode_cpmk: 'CPMK032', deskripsi: 'Menerapkan teknik pemrograman untuk pengembangan aplikasi dan solusi IT.', mata_kuliah_id: getMKId('MK10'), cpl_id: getCPLId('CPL03'), is_template: true },
        { kode_cpmk: 'CPMK033', deskripsi: 'Menganalisis dan mengelola data menggunakan metode statistik dan komputasi.', mata_kuliah_id: getMKId('MK25'), cpl_id: getCPLId('CPL03'), is_template: true },
        { kode_cpmk: 'CPMK034', deskripsi: 'Mengintegrasikan teknologi terkini seperti cloud computing, big data, dan IoT dalam solusi IT.', mata_kuliah_id: getMKId('MK27'), cpl_id: getCPLId('CPL03'), is_template: true },
        { kode_cpmk: 'CPMK035', deskripsi: 'Memahami dan menerapkan prinsip keamanan data dan informasi dalam sistem komputer dan jaringan.', mata_kuliah_id: getMKId('MK07'), cpl_id: getCPLId('CPL03'), is_template: true },
        { kode_cpmk: 'CPMK036', deskripsi: 'Mengembangkan keterampilan manajemen proyek dan riset operasional dalam konteks teknologi informasi.', mata_kuliah_id: getMKId('MK03'), cpl_id: getCPLId('CPL03'), is_template: true },

        // CPL04 - CPMK04x
        { kode_cpmk: 'CPMK041', deskripsi: 'Menerapkan algoritma dan teknik pemrograman untuk menyelesaikan masalah kompleks.', mata_kuliah_id: getMKId('MK06'), cpl_id: getCPLId('CPL04'), is_template: true },
        { kode_cpmk: 'CPMK042', deskripsi: 'Menggunakan prinsip matematika diskrit dan logika untuk menganalisis masalah dan mengembangkan solusi.', mata_kuliah_id: getMKId('MK19'), cpl_id: getCPLId('CPL04'), is_template: true },
        { kode_cpmk: 'CPMK043', deskripsi: 'Menerapkan konsep dan teori dari ilmu komputer untuk memahami dan menyelesaikan masalah teknologi informasi.', mata_kuliah_id: getMKId('MK39'), cpl_id: getCPLId('CPL04'), is_template: true },
        { kode_cpmk: 'CPMK044', deskripsi: 'Mengelola dan menganalisis data besar menggunakan metode dan teknik canggih dalam komputasi.', mata_kuliah_id: getMKId('MK24'), cpl_id: getCPLId('CPL04'), is_template: true },
        { kode_cpmk: 'CPMK045', deskripsi: 'Merancang dan mengimplementasikan solusi infrastruktur TI seperti cloud computing dan jaringan komputer.', mata_kuliah_id: getMKId('MK27'), cpl_id: getCPLId('CPL04'), is_template: true },
        { kode_cpmk: 'CPMK046', deskripsi: 'Menerapkan prinsip rekayasa perangkat lunak dan analisis desain dalam pengembangan solusi teknologi informasi.', mata_kuliah_id: getMKId('MK09'), cpl_id: getCPLId('CPL04'), is_template: true },
        { kode_cpmk: 'CPMK047', deskripsi: 'Mengintegrasikan teknologi terkini seperti IoT dan keamanan data dalam solusi IT, dengan mempertimbangkan perkembangan ilmu baru.', mata_kuliah_id: getMKId('MK07'), cpl_id: getCPLId('CPL04'), is_template: true },
        { kode_cpmk: 'CPMK048', deskripsi: 'Mengembangkan keterampilan manajemen proyek dan riset operasional untuk memimpin dan mengevaluasi proyek TI.', mata_kuliah_id: getMKId('MK43'), cpl_id: getCPLId('CPL04'), is_template: true },

        // CPL05 - CPMK05x
        { kode_cpmk: 'CPMK051', deskripsi: 'Menerapkan prinsip algoritma dan struktur data dalam desain aplikasi multi-platform.', mata_kuliah_id: getMKId('MK06'), cpl_id: getCPLId('CPL05'), is_template: true },
        { kode_cpmk: 'CPMK052', deskripsi: 'Memahami dan menerapkan konsep matematika dan logika informatika dalam pengembangan solusi IT.', mata_kuliah_id: getMKId('MK26'), cpl_id: getCPLId('CPL05'), is_template: true },
        { kode_cpmk: 'CPMK053', deskripsi: 'Mengintegrasikan prinsip-prinsip ilmu komputer dan arsitektur komputer dalam merancang sistem yang efisien.', mata_kuliah_id: getMKId('MK39'), cpl_id: getCPLId('CPL05'), is_template: true },
        { kode_cpmk: 'CPMK054', deskripsi: 'Menerapkan teknik cloud computing dan manajemen teknologi informasi dalam pengembangan aplikasi.', mata_kuliah_id: getMKId('MK27'), cpl_id: getCPLId('CPL05'), is_template: true },
        { kode_cpmk: 'CPMK055', deskripsi: 'Mendesain dan mengimplementasikan sistem keamanan informasi yang efektif untuk aplikasi multi-platform.', mata_kuliah_id: getMKId('MK07'), cpl_id: getCPLId('CPL05'), is_template: true },
        { kode_cpmk: 'CPMK056', deskripsi: 'Menerapkan prinsip Human-Computer Interaction (HCI) dalam pengembangan aplikasi yang user-friendly dan intuitif.', mata_kuliah_id: getMKId('MK22'), cpl_id: getCPLId('CPL05'), is_template: true },
        { kode_cpmk: 'CPMK057', deskripsi: 'Mengembangkan keterampilan analisis dan desain perangkat lunak untuk aplikasi multi-platform.', mata_kuliah_id: getMKId('MK09'), cpl_id: getCPLId('CPL05'), is_template: true },
        { kode_cpmk: 'CPMK058', deskripsi: 'Menerapkan metode manajemen sains dan riset operasional dalam desain dan evaluasi proyek teknologi informasi.', mata_kuliah_id: getMKId('MK46'), cpl_id: getCPLId('CPL05'), is_template: true },

        // CPL06 - CPMK06x
        { kode_cpmk: 'CPMK061', deskripsi: 'Menerapkan pendekatan logis dan sistematis dalam pemrograman untuk mengembangkan aplikasi web dan mobile yang efektif.', mata_kuliah_id: getMKId('MK10'), cpl_id: getCPLId('CPL06'), is_template: true },
        { kode_cpmk: 'CPMK062', deskripsi: 'Menggunakan prinsip pemrograman berorientasi objek untuk menciptakan software yang efisien dan modular.', mata_kuliah_id: getMKId('MK14'), cpl_id: getCPLId('CPL06'), is_template: true },
        { kode_cpmk: 'CPMK063', deskripsi: 'Menerapkan prinsip-prinsip Human-Computer Interaction untuk menciptakan antarmuka pengguna yang intuitif dan ramah pengguna.', mata_kuliah_id: getMKId('MK22'), cpl_id: getCPLId('CPL06'), is_template: true },
        { kode_cpmk: 'CPMK064', deskripsi: 'Menerapkan pemikiran kritis dan analitis dalam memecahkan masalah kompleks melalui logika informatika.', mata_kuliah_id: getMKId('MK26'), cpl_id: getCPLId('CPL06'), is_template: true },
        { kode_cpmk: 'CPMK065', deskripsi: 'Mengintegrasikan prinsip desain grafis dan animasi dalam pengembangan konten multimedia yang kreatif dan inovatif.', mata_kuliah_id: getMKId('MK42'), cpl_id: getCPLId('CPL06'), is_template: true },
        { kode_cpmk: 'CPMK066', deskripsi: 'Menerapkan metodologi riset operasional dalam pengambilan keputusan yang sistematis untuk proyek teknologi.', mata_kuliah_id: getMKId('MK46'), cpl_id: getCPLId('CPL06'), is_template: true },
        { kode_cpmk: 'CPMK067', deskripsi: 'Mengembangkan solusi teknologi yang mempertimbangkan aspek humaniora dan nilai etika dalam bidang keahliannya.', mata_kuliah_id: getMKId('MK22'), cpl_id: getCPLId('CPL06'), is_template: true },

        // CPL07 - CPMK07x
        { kode_cpmk: 'CPMK071', deskripsi: 'Mengembangkan dan menerapkan strategi analisis jejaring sosial yang mandiri dan inovatif.', mata_kuliah_id: getMKId('MK53'), cpl_id: getCPLId('CPL07'), is_template: true },
        { kode_cpmk: 'CPMK072', deskripsi: 'Menerapkan keterampilan kewirausahaan digital secara mandiri dalam proyek dan inisiatif teknologi.', mata_kuliah_id: getMKId('MK40'), cpl_id: getCPLId('CPL07'), is_template: true },
        { kode_cpmk: 'CPMK073', deskripsi: 'Mengembangkan dan menerapkan keterampilan interpersonal yang efektif dalam konteks profesional dan akademis.', mata_kuliah_id: getMKId('MK51'), cpl_id: getCPLId('CPL07'), is_template: true },
        { kode_cpmk: 'CPMK074', deskripsi: 'Merancang dan melaksanakan strategi pemasaran digital yang efektif dan terukur.', mata_kuliah_id: getMKId('MK47'), cpl_id: getCPLId('CPL07'), is_template: true },
        { kode_cpmk: 'CPMK075', deskripsi: 'Menerapkan prinsip-prinsip pemrograman lanjutan untuk mengembangkan aplikasi mobile yang mandiri dan bermutu.', mata_kuliah_id: getMKId('MK36'), cpl_id: getCPLId('CPL07'), is_template: true },
        { kode_cpmk: 'CPMK076', deskripsi: 'Menyusun dan menyajikan hasil penelitian atau proyek dalam bentuk seminar dengan standar akademis yang tinggi.', mata_kuliah_id: getMKId('MK37'), cpl_id: getCPLId('CPL07'), is_template: true },
        { kode_cpmk: 'CPMK077', deskripsi: 'Melakukan penelitian mandiri dan menyusun tugas akhir yang memenuhi standar kualitas akademis yang tinggi.', mata_kuliah_id: getMKId('MK33'), cpl_id: getCPLId('CPL07'), is_template: true },

        // CPL08 - CPMK08x
        { kode_cpmk: 'CPMK081', deskripsi: 'Menerapkan algoritma dan teknik pemrograman untuk mengembangkan solusi komputasi yang efisien.', mata_kuliah_id: getMKId('MK06'), cpl_id: getCPLId('CPL08'), is_template: true },
        { kode_cpmk: 'CPMK082', deskripsi: 'Menganalisis dan merancang perangkat lunak yang memenuhi spesifikasi dan kebutuhan pengguna dengan metode yang sesuai.', mata_kuliah_id: getMKId('MK14'), cpl_id: getCPLId('CPL08'), is_template: true },
        { kode_cpmk: 'CPMK083', deskripsi: 'Mengimplementasikan solusi big data dan pembelajaran mesin untuk mengekstrak wawasan dari dataset besar.', mata_kuliah_id: getMKId('MK08'), cpl_id: getCPLId('CPL08'), is_template: true },
        { kode_cpmk: 'CPMK084', deskripsi: 'Merancang dan mengembangkan solusi berbasis cloud dan IoT yang memanfaatkan teknologi terkini.', mata_kuliah_id: getMKId('MK34'), cpl_id: getCPLId('CPL08'), is_template: true },
        { kode_cpmk: 'CPMK085', deskripsi: 'Mengaplikasikan prinsip desain grafis dan animasi dalam pengembangan konten multimedia yang inovatif.', mata_kuliah_id: getMKId('MK42'), cpl_id: getCPLId('CPL08'), is_template: true },
        { kode_cpmk: 'CPMK086', deskripsi: 'Menerapkan teknik kecerdasan buatan dalam pengembangan solusi yang inovatif untuk berbagai aplikasi, termasuk e-government.', mata_kuliah_id: getMKId('MK12'), cpl_id: getCPLId('CPL08'), is_template: true },

        // CPL09 - CPMK09x
        { kode_cpmk: 'CPMK091', deskripsi: 'Menganalisis dan merancang user interface yang intuitif dan mudah digunakan untuk berbagai aplikasi.', mata_kuliah_id: getMKId('MK22'), cpl_id: getCPLId('CPL09'), is_template: true },
        { kode_cpmk: 'CPMK092', deskripsi: 'Membuat dan mengevaluasi aplikasi interaktif dengan mempertimbangkan kebutuhan pengguna dan praktik terbaik HCI.', mata_kuliah_id: getMKId('MK22'), cpl_id: getCPLId('CPL09'), is_template: true },
        { kode_cpmk: 'CPMK093', deskripsi: 'Menerapkan teknik visualisasi data untuk menyajikan informasi yang kompleks secara efektif dan intuitif.', mata_kuliah_id: getMKId('MK50'), cpl_id: getCPLId('CPL09'), is_template: true },
        { kode_cpmk: 'CPMK094', deskripsi: 'Merancang dan mengembangkan solusi e-government dan smart city yang berfokus pada interaksi pengguna yang efektif.', mata_kuliah_id: getMKId('MK52'), cpl_id: getCPLId('CPL09'), is_template: true },
        { kode_cpmk: 'CPMK095', deskripsi: 'Mengintegrasikan prinsip desain dan rekayasa perangkat lunak dalam pengembangan aplikasi yang berorientasi pengguna.', mata_kuliah_id: getMKId('MK08'), cpl_id: getCPLId('CPL09'), is_template: true },
        { kode_cpmk: 'CPMK096', deskripsi: 'Menerapkan konsep jaringan komputer dalam mendukung interaktivitas dan konektivitas aplikasi.', mata_kuliah_id: getMKId('MK13'), cpl_id: getCPLId('CPL09'), is_template: true },
        { kode_cpmk: 'CPMK097', deskripsi: 'Menganalisis dan mengoptimalkan rekam medis elektronik untuk memaksimalkan kegunaan dan interaktivitas bagi pengguna.', mata_kuliah_id: getMKId('MK49'), cpl_id: getCPLId('CPL09'), is_template: true },

        // CPL10 - CPMK10x
        { kode_cpmk: 'CPMK101', deskripsi: 'Menerapkan prinsip-prinsip analisis dan desain perangkat lunak untuk mengembangkan solusi computing yang efisien.', mata_kuliah_id: getMKId('MK09'), cpl_id: getCPLId('CPL10'), is_template: true },
        { kode_cpmk: 'CPMK102', deskripsi: 'Mengembangkan aplikasi mobile yang responsif dan fungsional di berbagai platform.', mata_kuliah_id: getMKId('MK28'), cpl_id: getCPLId('CPL10'), is_template: true },
        { kode_cpmk: 'CPMK103', deskripsi: 'Merancang dan mengimplementasikan infrastruktur cloud computing yang efisien untuk kebutuhan organisasi.', mata_kuliah_id: getMKId('MK34'), cpl_id: getCPLId('CPL10'), is_template: true },
        { kode_cpmk: 'CPMK104', deskripsi: 'Mengevaluasi performa dan keamanan aplikasi mobile dalam konteks kebutuhan organisasi yang beragam.', mata_kuliah_id: getMKId('MK28'), cpl_id: getCPLId('CPL10'), is_template: true },
        { kode_cpmk: 'CPMK105', deskripsi: 'Menerapkan teknik dan alat pemrograman terkini untuk mengembangkan solusi multi-platform yang inovatif.', mata_kuliah_id: getMKId('MK28'), cpl_id: getCPLId('CPL10'), is_template: true },
        { kode_cpmk: 'CPMK106', deskripsi: 'Menganalisis kebutuhan pengguna dan merancang antarmuka pengguna yang intuitif untuk aplikasi multi-platform.', mata_kuliah_id: getMKId('MK09'), cpl_id: getCPLId('CPL10'), is_template: true },
        { kode_cpmk: 'CPMK107', deskripsi: 'Menerapkan metode evaluasi yang sistematis untuk menguji dan memastikan kualitas solusi computing multi-platform.', mata_kuliah_id: getMKId('MK09'), cpl_id: getCPLId('CPL10'), is_template: true },

        // CPL11 - CPMK11x
        { kode_cpmk: 'CPMK111', deskripsi: 'Menerapkan analisis data dan informasi untuk membuat keputusan bisnis yang efektif dalam konteks digital entrepreneurship.', mata_kuliah_id: getMKId('MK40'), cpl_id: getCPLId('CPL11'), is_template: true },
        { kode_cpmk: 'CPMK112', deskripsi: 'Menggunakan teknik visualisasi data untuk menyajikan informasi yang mendukung pengambilan keputusan.', mata_kuliah_id: getMKId('MK50'), cpl_id: getCPLId('CPL11'), is_template: true },
        { kode_cpmk: 'CPMK113', deskripsi: 'Menerapkan pendekatan berbasis data dalam merancang dan mengevaluasi kebijakan e-government dan smart city.', mata_kuliah_id: getMKId('MK52'), cpl_id: getCPLId('CPL11'), is_template: true },
        { kode_cpmk: 'CPMK114', deskripsi: 'Mengaplikasikan konsep dan strategi pemasaran digital berdasarkan analisis data untuk promosi yang efektif.', mata_kuliah_id: getMKId('MK47'), cpl_id: getCPLId('CPL11'), is_template: true },
        { kode_cpmk: 'CPMK115', deskripsi: 'Mengintegrasikan pengetahuan dalam merencanakan dan mengimplementasikan strategi promosi kesehatan yang efektif.', mata_kuliah_id: getMKId('MK54'), cpl_id: getCPLId('CPL11'), is_template: true },
        { kode_cpmk: 'CPMK116', deskripsi: 'Menerapkan metode dan teknik pembelajaran berbasis masyarakat (MBKM) dalam mengembangkan solusi praktis di lapangan.', mata_kuliah_id: getMKId('MK55'), cpl_id: getCPLId('CPL11'), is_template: true },

        // CPL12 - CPMK12x
        { kode_cpmk: 'CPMK121', deskripsi: 'Mengaplikasikan prinsip hukum dan kebijakan TI dalam pengelolaan dan penyimpanan data untuk memastikan integritas dan keaslian.', mata_kuliah_id: getMKId('MK02'), cpl_id: getCPLId('CPL12'), is_template: true },
        { kode_cpmk: 'CPMK122', deskripsi: 'Mengembangkan keterampilan dalam penulisan ilmiah yang etis, termasuk teknik mendokumentasikan dan menghindari plagiarisme.', mata_kuliah_id: getMKId('MK33'), cpl_id: getCPLId('CPL12'), is_template: true },
        { kode_cpmk: 'CPMK123', deskripsi: 'Menerapkan teknik dan alat yang tepat untuk penyimpanan dan pengamanan data dalam konteks penelitian dan pengembangan akademis.', mata_kuliah_id: getMKId('MK31'), cpl_id: getCPLId('CPL12'), is_template: true },
        { kode_cpmk: 'CPMK124', deskripsi: 'Memahami dan menerapkan prosedur etis dalam penyajian data dan informasi penelitian dalam seminar dan publikasi akademis.', mata_kuliah_id: getMKId('MK37'), cpl_id: getCPLId('CPL12'), is_template: true },
        { kode_cpmk: 'CPMK125', deskripsi: 'Menggunakan sistem manajemen basis data dan alat penyimpanan lainnya untuk mengorganisir dan mengamankan data penelitian.', mata_kuliah_id: getMKId('MK02'), cpl_id: getCPLId('CPL12'), is_template: true },
        { kode_cpmk: 'CPMK126', deskripsi: 'Menerapkan metode yang efektif untuk menemukan kembali data dan informasi secara cepat dan akurat dalam berbagai konteks akademis.', mata_kuliah_id: getMKId('MK33'), cpl_id: getCPLId('CPL12'), is_template: true }
    ];

    const cpmk = await CPMK.bulkCreate(cpmkData);
    console.log(`✅ Seeded ${cpmk.length} CPMK template`);
    return cpmk;
};

// Seed Users (1 Kaprodi, 2 Dosen)
export const seedUsers = async (prodiId) => {
    // Hash password manually since hooks don't run on bulkCreate
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await User.bulkCreate([
        {
            username: 'kaprodi_ti',
            email: 'kaprodi@mahardika.ac.id',
            password_hash: hashedPassword,
            role: 'kaprodi',
            nama_lengkap: 'Dr. Indra Surya Permana, MM., M.Kom.',
            prodi_id: prodiId,
            is_active: true
        },
        {
            username: 'dosen_andi',
            email: 'andi@mahardika.ac.id',
            password_hash: hashedPassword,
            role: 'dosen',
            nama_lengkap: 'Andi Wijaya, S.Kom, M.T',
            prodi_id: prodiId,
            is_active: true
        },
        {
            username: 'dosen_siti',
            email: 'siti@mahardika.ac.id',
            password_hash: hashedPassword,
            role: 'dosen',
            nama_lengkap: 'Siti Nurhaliza, S.Kom, M.Kom',
            prodi_id: prodiId,
            is_active: true
        }
    ]);

    console.log(`✅ Seeded ${users.length} Users (1 Kaprodi, 2 Dosen)`);
    return users;
};

// Seed Mahasiswa (30 dummy students)
export const seedMahasiswa = async (prodiId) => {
    const mahasiswaData = [];
    const names = [
        'Ahmad Rizki', 'Bella Putri', 'Candra Wijaya', 'Dian Puspita', 'Eko Prasetyo',
        'Fitri Handayani', 'Galih Pratama', 'Hana Safitri', 'Indra Gunawan', 'Joko Susilo',
        'Karina Dewi', 'Luthfi Rahman', 'Maya Sari', 'Nabil Akbar', 'Olivia Tan',
        'Prima Adhitya', 'Qori Amalia', 'Rizal Fauzi', 'Sari Wulandari', 'Toni Hermawan',
        'Umi Kalsum', 'Vino Alamsyah', 'Winda Lestari', 'Xavier Kurnia', 'Yuni Astuti',
        'Zaki Hidayat', 'Aulia Rahman', 'Bagus Santoso', 'Citra Maharani', 'Dika Permana'
    ];

    const currentYear = new Date().getFullYear();
    const angkatan = currentYear - 2; // Mahasiswa angkatan 2 tahun lalu

    for (let i = 0; i < 30; i++) {
        const npm = `${angkatan}${String(i + 1).padStart(3, '0')}`;
        mahasiswaData.push({
            npm: npm,
            nama: names[i],
            email: `${npm}@student.mahardika.ac.id`,
            prodi_id: prodiId,
            angkatan: angkatan.toString(),
            is_active: true
        });
    }

    const mahasiswa = await Mahasiswa.bulkCreate(mahasiswaData);
    console.log(`✅ Seeded ${mahasiswa.length} Mahasiswa`);
    return mahasiswa;
};
