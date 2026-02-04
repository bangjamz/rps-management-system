import { CPL, Prodi } from './models/index.js';
import sequelize from './config/database.js';
import { Op } from 'sequelize';

const cplData = [
    { code: '01', deskripsi: 'Bertakwa kepada Tuhan Yang Maha Esa dan mampu menunjukkan sikap religious.', keterangan: 'S01', kategori: 'Sikap' },
    { code: '02', deskripsi: 'Menginternalisasi semangat kemandirian, kejuangan, dan kewirausahaan.', keterangan: 'S10', kategori: 'Sikap' },
    { code: '03', deskripsi: 'Memiliki pengetahuan yang memadai terkait cara kerja sistem komputer dan mampu menerapkan/menggunakan berbagai algoritma/metode untuk memecahkan masalah pada suatu organisasi.', keterangan: 'WAJIB', kategori: 'Pengetahuan' },
    { code: '04', deskripsi: 'Memiliki kompetensi untuk menganalisis persoalan computing yang kompleks untuk mengidentifikasi solusi pengelolaan proyek teknologi bidang informatika/ilmu komputer dengan mempertimbangkan wawasan perkembangan ilmu transdisiplin', keterangan: 'WAJIB', kategori: 'Keterampilan Khusus' },
    { code: '05', deskripsi: 'Menguasai konsep teoritis bidang pengetahuan Ilmu Komputer/Informatika dalam mendesain dan mensimulasikan aplikasi teknologi multi-platform yang relevan dengan kebutuhan industri dan masyarakat.', keterangan: 'WAJIB', kategori: 'Pengetahuan' },
    { code: '06', deskripsi: 'Mampu menerapkan pemikiran logis, kritis, sistematis, dan inovatif dalam konteks pengembangan atau implementasi ilmu pengetahuan dan teknologi yang memperhatikan dan menerapkan nilai humaniora yang sesuai dengan bidang keahliannya.', keterangan: 'KU01', kategori: 'Keterampilan Umum' },
    { code: '07', deskripsi: 'Mampu menunjukkan kinerja mandiri, bermutu, dan terukur.', keterangan: 'KU02', kategori: 'Keterampilan Umum' },
    { code: '08', deskripsi: 'Kemampuan mengimplementasi kebutuhan computing dengan mempertimbangkan berbagai metode/algoritma yang sesuai.', keterangan: 'WAJIB', kategori: 'Keterampilan Khusus' },
    { code: '09', deskripsi: 'Kemampuan menganalisis, merancang, membuat dan mengevaluasi user interface dan aplikasi interaktif dengan mempertimbangkan kebutuhan pengguna dan perkembangan ilmu transdisiplin.', keterangan: 'WAJIB', kategori: 'Keterampilan Khusus' },
    { code: '10', deskripsi: 'Kemampuan mendesain, mengimplementasi dan mengevaluasi solusi berbasis computing multi-platform yang memenuhi kebutuhan-kebutuhan computing pada sebuah organisasi.', keterangan: 'WAJIB', kategori: 'Keterampilan Khusus' },
    { code: '11', deskripsi: 'Mampu mengambil keputusan secara tepat dalam konteks penyelesaian masalah di bidang keahliannya, berdasarkan hasil analisis informasi dan data.', keterangan: 'KU05', kategori: 'Keterampilan Umum' },
    { code: '12', deskripsi: 'Mampu mendokumentasikan, menyimpan, mengamankan, dan menemukan kembali data untuk menjamin kesahihan dan mencegah plagiasi.', keterangan: 'KU09', kategori: 'Keterampilan Umum' }
];

const seed = async () => {
    try {
        console.log('Connecting to database...');
        // Find Prodi Informatika
        const prodi = await Prodi.findOne({
            where: {
                nama: { [Op.like]: '%Informatika%' }
            }
        });

        if (!prodi) {
            console.error('Prodi Informatika not found!');
            process.exit(1);
        }

        console.log(`Found Prodi: ${prodi.nama} (ID: ${prodi.id})`);

        // Delete existing CPLs for this Prodi
        const deleted = await CPL.destroy({
            where: { prodi_id: prodi.id }
        });
        console.log(`Deleted ${deleted} existing CPLs for ${prodi.nama}`);

        // Create new CPLs
        const cplsToCreate = cplData.map(item => ({
            kode_cpl: `IF-CPL${item.code}`,
            deskripsi: item.deskripsi,
            keterangan: item.keterangan,
            kategori: item.kategori,
            prodi_id: prodi.id,
            level: 'prodi',
            is_active: true
        }));

        await CPL.bulkCreate(cplsToCreate);
        console.log(`Successfully created ${cplsToCreate.length} CPLs for ${prodi.nama}`);

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
};

seed();
