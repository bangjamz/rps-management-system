import { User, UserProfile } from '../models/index.js';
import bcrypt from 'bcryptjs';

const fixAccounts = async () => {
    try {
        console.log('--- Fixing User Accounts ---');

        // Helper to ensure profile
        const ensureProfile = async (userId, data) => {
            let profile = await UserProfile.findOne({ where: { user_id: userId } });
            if (!profile) {
                console.log(`Creating profile for User ID: ${userId}...`);
                await UserProfile.create({
                    user_id: userId,
                    ...data
                });
            } else {
                console.log(`Profile already exists for User ID: ${userId}.`);
            }
        };

        // 1. Fix kaprodi_informatika
        console.log('Checking kaprodi_informatika...');
        let kaprodi = await User.findOne({ where: { username: 'kaprodi_informatika' } });
        if (kaprodi) {
            kaprodi.status = 'approved';
            kaprodi.email_verified = true;
            await kaprodi.save();
            console.log('✅ kaprodi_informatika status set to approved.');
        } else {
            kaprodi = await User.create({
                username: 'kaprodi_informatika',
                email: 'kaprodi.if@mahardika.ac.id',
                password_hash: 'password123',
                nama_lengkap: 'Dr. Indra Surya Permana, MM., M.Kom.',
                role: 'kaprodi',
                status: 'approved',
                email_verified: true,
                prodi_id: 1
            });
            console.log('✅ kaprodi_informatika created.');
        }
        await ensureProfile(kaprodi.id, {
            profile_type: 'dosen',
            phone: '08123456789',
            address: 'Institut Mahardika',
            nidn: '9988776655',
            jabatan_fungsional: 'Lektor',
            pendidikan_terakhir: 'S3',
            bidang_keahlian: 'Informatika',
            homebase: 'Informatika',
            status_kepegawaian: 'Dosen Tetap'
        });

        // 2. Fix/Create bangjamz_superadmin
        const superUsername = 'bangjamz_superadmin';
        const superEmail = 'bangjamz@mahardika.ac.id';
        console.log(`Checking ${superUsername}...`);
        let superAdmin = await User.findOne({ where: { username: superUsername } });
        if (!superAdmin) {
            // Check if email taken
            let emailTaken = await User.findOne({ where: { email: superEmail } });
            if (emailTaken) {
                console.log(`Warning: Email ${superEmail} taken by ${emailTaken.username}. Updating that user.`);
                superAdmin = emailTaken;
                superAdmin.username = superUsername;
            } else {
                superAdmin = await User.create({
                    username: superUsername,
                    email: superEmail,
                    password_hash: 'password123',
                    nama_lengkap: 'Bangjamz Super Admin',
                    role: 'superadmin',
                    status: 'approved',
                    email_verified: true
                });
                console.log(`✅ ${superUsername} created.`);
            }
        }

        superAdmin.role = 'superadmin';
        superAdmin.status = 'approved';
        superAdmin.email_verified = true;
        await superAdmin.save();
        console.log(`✅ ${superUsername} status/role verified.`);

        await ensureProfile(superAdmin.id, {
            profile_type: 'dosen',
            phone: '08111222333',
            address: 'HQ mahardika',
            nidn: '1122334455',
            jabatan_fungsional: 'Profesor',
            pendidikan_terakhir: 'S3',
            bidang_keahlian: 'System Architecture',
            homebase: 'Universitas',
            status_kepegawaian: 'Dosen Tetap'
        });

        // 3. Optional: Fix admin_mahardika (the one using admin@mahardika.ac.id)
        console.log('Approving admin_mahardika...');
        let admin = await User.findOne({ where: { email: 'admin@mahardika.ac.id' } });
        if (admin) {
            admin.status = 'approved';
            admin.email_verified = true;
            await admin.save();
            await ensureProfile(admin.id, {
                profile_type: 'dosen',
                phone: '08123456780',
                address: 'Institut Mahardika',
                nidn: '1122334466',
                jabatan_fungsional: 'Lektor',
                pendidikan_terakhir: 'S2',
                bidang_keahlian: 'Administrasi',
                homebase: 'Fakultas',
                status_kepegawaian: 'Dosen Tetap'
            });
            console.log('✅ admin_mahardika approved.');
        }

        console.log('--- Account Fix Completed ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing accounts:', error);
        process.exit(1);
    }
};

fixAccounts();
