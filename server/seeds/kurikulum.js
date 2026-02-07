import sequelize from '../config/database.js';
import { Prodi, ProfilLulusan, CPL, BahanKajian } from '../models/index.js';

// Seed Prodi (Program Studi)
export const seedProdi = async () => {
    const prodi = await Prodi.create({
        kode: 'TI-S1',
        nama: 'Teknik Informatika',
        fakultas: 'Fakultas Ilmu Kesehatan dan Teknologi',
        jenjang: 'S1',
        is_active: true
    });

    console.log('✅ Seeded Prodi:', prodi.nama);
    return prodi;
};

// Seed Profil Lulusan (PL)
export const seedProfilLulusan = async (prodiId) => {
    const plData = [
        {
            prodi_id: prodiId,
            kode_pl: 'PL1',
            deskripsi: '(IABEE) Lulusan memiliki kemampuan menganalisis persoalan computing serta menerapkan prinsip-prinsip computing dan disiplin ilmu relevan lainnya untuk mengidentifikasi solusi bagi organisasi.',
            unsur: 'Pengetahuan',
            sifat: 'Wajib'
        },
        {
            prodi_id: prodiId,
            kode_pl: 'PL2',
            deskripsi: '(IABEE) Lulusan memiliki kemampuan mendesain, mengimplementasi dan mengevaluasi solusi berbasis computing yang memenuhi kebutuhan pengguna dengan pendekatan yang sesuai.',
            unsur: 'Keterampilan Khusus',
            sifat: 'Wajib'
        },
        {
            prodi_id: prodiId,
            kode_pl: 'PL3',
            deskripsi: '(KKNI 01) Lulusan mampu menunjukkan kinerja mandiri, bermutu, dan terukur.',
            unsur: 'Sikap',
            sifat: 'Pilihan'
        },
        {
            prodi_id: prodiId,
            kode_pl: 'PL4',
            deskripsi: '(KKNI) Lulusan memiliki kepatuhan terhadap aspek legal, aspek sosial budaya dan etika profesi.',
            unsur: 'Sikap',
            sifat: 'Pilihan'
        },
        {
            prodi_id: prodiId,
            kode_pl: 'PL5',
            deskripsi: '(KKNI 02, CS 2013, SN Dikti 01) Lulusan mampu berpikir logis, kritis serta sistematis dalam memanfaatkan ilmu pengetahuan informatika/ ilmu komputer untuk menyelesaikan masalah nyata.',
            unsur: 'Keterampilan Umum',
            sifat: 'Pilihan'
        }
    ];

    const profilLulusan = await ProfilLulusan.bulkCreate(plData);
    console.log(`✅ Seeded ${profilLulusan.length} Profil Lulusan`);
    return profilLulusan;
};

// Seed CPL (Capaian Pembelajaran Lulusan)
export const seedCPL = async (prodiId, plList) => {
    const cplData = [
        { prodi_id: prodiId, pl_id: null, kode_cpl: 'CPL01', deskripsi: 'Bertakwa kepada Tuhan Yang Maha Esa dan mampu menunjukkan sikap religious.', keterangan: 'S01', kategori: 'Sikap' },
        { prodi_id: prodiId, pl_id: null, kode_cpl: 'CPL02', deskripsi: 'Menginternalisasi semangat kemandirian, kejuangan, dan kewirausahaan.', keterangan: 'S10', kategori: 'Sikap' },
        { prodi_id: prodiId, pl_id: null, kode_cpl: 'CPL03', deskripsi: 'Memiliki pengetahuan yang memadai terkait cara kerja sistem komputer dan mampu menerapkan/menggunakan berbagai algoritma/metode untuk memecahkan masalah pada suatu organisasi.', keterangan: 'WAJIB', kategori: 'Pengetahuan' },
        { prodi_id: prodiId, pl_id: null, kode_cpl: 'CPL04', deskripsi: 'Memiliki kompetensi untuk menganalisis persoalan computing yang kompleks untuk mengidentifikasi solusi pengelolaan proyek teknologi bidang informatika/ilmu komputer dengan mempertimbangkan wawasan perkembangan ilmu transdisiplin', keterangan: 'WAJIB', kategori: 'Pengetahuan' },
        { prodi_id: prodiId, pl_id: null, kode_cpl: 'CPL05', deskripsi: 'Menguasai konsep teoritis bidang pengetahuan Ilmu Komputer/Informatika dalam mendesain dan mensimulasikan aplikasi teknologi multi-platform yang relevan dengan kebutuhan industri dan masyarakat.', keterangan: 'WAJIB', kategori: 'Pengetahuan' },
        { prodi_id: prodiId, pl_id: null, kode_cpl: 'CPL06', deskripsi: 'Mampu menerapkan pemikiran logis, kritis, sistematis, dan inovatif dalam konteks pengembangan atau implementasi ilmu pengetahuan dan teknologi yang memperhatikan dan menerapkan nilai humaniora yang sesuai dengan bidang keahliannya.', keterangan: 'KU01', kategori: 'Keterampilan Umum' },
        { prodi_id: prodiId, pl_id: null, kode_cpl: 'CPL07', deskripsi: 'Mampu menunjukkan kinerja mandiri, bermutu, dan terukur.', keterangan: 'KU02', kategori: 'Keterampilan Umum' },
        { prodi_id: prodiId, pl_id: null, kode_cpl: 'CPL08', deskripsi: 'Kemampuan mengimplementasi kebutuhan computing dengan mempertimbangkan berbagai metode/algoritma yang sesuai.', keterangan: 'WAJIB', kategori: 'Keterampilan Khusus' },
        { prodi_id: prodiId, pl_id: null, kode_cpl: 'CPL09', deskripsi: 'Kemampuan menganalisis, merancang, membuat dan mengevaluasi user interface dan aplikasi interaktif dengan mempertimbangkan kebutuhan pengguna dan perkembangan ilmu transdisiplin.', keterangan: 'WAJIB', kategori: 'Keterampilan Khusus' },
        { prodi_id: prodiId, pl_id: null, kode_cpl: 'CPL10', deskripsi: 'Kemampuan mendesain, mengimplementasi dan mengevaluasi solusi berbasis computing multi-platform yang memenuhi kebutuhan-kebutuhan computing pada sebuah organisasi.', keterangan: 'WAJIB', kategori: 'Keterampilan Khusus' },
        { prodi_id: prodiId, pl_id: null, kode_cpl: 'CPL11', deskripsi: 'Mampu mengambil keputusan secara tepat dalam konteks penyelesaian masalah di bidang keahliannya, berdasarkan hasil analisis informasi dan data.', keterangan: 'KU05', kategori: 'Keterampilan Umum' },
        { prodi_id: prodiId, pl_id: null, kode_cpl: 'CPL12', deskripsi: 'Mampu mendokumentasikan, menyimpan, mengamankan, dan menemukan kembali data untuk menjamin kesahihan dan mencegah plagiasi.', keterangan: 'KU09', kategori: 'Keterampilan Umum' }
    ];

    const cpl = await CPL.bulkCreate(cplData);
    console.log(`✅ Seeded ${cpl.length} CPL`);
    return cpl;
};

// Seed Bahan Kajian (BK)
export const seedBahanKajian = async (prodiId) => {
    const bkData = [
        // A - Bahan Kajian Wajib Informatika
        { prodi_id: prodiId, kode_bk: 'BK01', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Social Issues and Professional Practice', bobot_min: 2, bobot_max: 4 },
        { prodi_id: prodiId, kode_bk: 'BK02', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Security Policy and Management', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK03', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Project Management', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK04', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'User Experience Design', bobot_min: 2, bobot_max: 4 },
        { prodi_id: prodiId, kode_bk: 'BK05', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Security Issues and Principles', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK06', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Data and Information Management', bobot_min: 2, bobot_max: 4 },
        { prodi_id: prodiId, kode_bk: 'BK07', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Parallel and Distributed Computing', bobot_min: 2, bobot_max: 4 },
        { prodi_id: prodiId, kode_bk: 'BK08', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Computer Networks', bobot_min: 2, bobot_max: 4 },
        { prodi_id: prodiId, kode_bk: 'BK09', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Security Technology and Implementation', bobot_min: 2, bobot_max: 4 },
        { prodi_id: prodiId, kode_bk: 'BK10', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Software Design', bobot_min: 2, bobot_max: 4 },
        { prodi_id: prodiId, kode_bk: 'BK11', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Operating Systems', bobot_min: 3, bobot_max: 5 },
        { prodi_id: prodiId, kode_bk: 'BK12', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Data Structures, Algorithms and Complexity', bobot_min: 4, bobot_max: 5 },
        { prodi_id: prodiId, kode_bk: 'BK13', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Programming Languages', bobot_min: 3, bobot_max: 5 },
        { prodi_id: prodiId, kode_bk: 'BK14', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Programming Fundamentals', bobot_min: 4, bobot_max: 5 },
        { prodi_id: prodiId, kode_bk: 'BK15', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Computing Systems Fundamentals', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK16', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Architecture and Organization', bobot_min: 3, bobot_max: 4 },
        { prodi_id: prodiId, kode_bk: 'BK17', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Graphics and Visualization', bobot_min: 2, bobot_max: 4 },
        { prodi_id: prodiId, kode_bk: 'BK18', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Intelligent Systems', bobot_min: 3, bobot_max: 5 },
        { prodi_id: prodiId, kode_bk: 'BK19', jenis: 'Bahan Kajian Wajib Informatika', deskripsi: 'Platform-based Development', bobot_min: 2, bobot_max: 4 },

        // B - BK Tambahan (Opsional)
        { prodi_id: prodiId, kode_bk: 'BK20', jenis: 'BK Tambahan (Opsional) Bidang Informatika', deskripsi: 'Computational Science', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK21', jenis: 'BK Tambahan (Opsional) Bidang Informatika', deskripsi: 'Discrete Structures', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK22', jenis: 'BK Tambahan (Opsional) Bidang Informatika', deskripsi: 'Human-Computer Interaction', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK23', jenis: 'BK Tambahan (Opsional) Bidang Informatika', deskripsi: 'Information Assurance and Security', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK24', jenis: 'BK Tambahan (Opsional) Bidang Informatika', deskripsi: 'Information Management', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK25', jenis: 'BK Tambahan (Opsional) Bidang Informatika', deskripsi: 'Networking and Communications', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK26', jenis: 'BK Tambahan (Opsional) Bidang Informatika', deskripsi: 'Software Development Fundamentals', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK27', jenis: 'BK Tambahan (Opsional) Bidang Informatika', deskripsi: 'Software Engineering', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK28', jenis: 'BK Tambahan (Opsional) Bidang Informatika', deskripsi: 'Systems Analysis & Design', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK29', jenis: 'BK Tambahan (Opsional) Bidang Informatika', deskripsi: 'Virtual Systems and Services', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK30', jenis: 'BK Tambahan (Opsional) Bidang Informatika', deskripsi: 'Software Quality, Verification and Validation', bobot_min: 2, bobot_max: 3 },
        { prodi_id: prodiId, kode_bk: 'BK31', jenis: 'BK Tambahan (Opsional) Bidang Informatika', deskripsi: 'Software Modeling and Analysis', bobot_min: 2, bobot_max: 3 },

        // C - BK Wajib SN Dikti
        { prodi_id: prodiId, kode_bk: 'BK32', jenis: 'BK Wajib SN Dikti', deskripsi: 'Pengembangan Diri', bobot_min: 2, bobot_max: 2 },

        // D - BK Wajib Umum
        { prodi_id: prodiId, kode_bk: 'BK33', jenis: 'BK Wajib Umum', deskripsi: 'Metodologi Penelitian', bobot_min: 2, bobot_max: 6 }
    ];

    const bahanKajian = await BahanKajian.bulkCreate(bkData);
    console.log(`✅ Seeded ${bahanKajian.length} Bahan Kajian`);
    return bahanKajian;
};
