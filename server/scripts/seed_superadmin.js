import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';

const seedSuperAdmin = async () => {
    try {
        const email = 'superadmin@mahardika.ac.id';
        const username = 'superadmin';
        const password = 'password123'; // Change this in production

        let admin = await User.findOne({ where: { email } });

        if (!admin) {
            console.log('Creating Super Admin account...');
            await User.create({
                username,
                email,
                password_hash: password, // Will be hashed by hook
                nama_lengkap: 'Super Administrator',
                role: 'superadmin',
                status: 'active',
                email_verified: true,
                created_at: new Date(),
                updated_at: new Date()
            });
            console.log(`✅ Super Admin created.\nEmail: ${email}\nPassword: ${password}`);
        } else {
            // Ensure permissions
            if (admin.role !== 'superadmin' || admin.status !== 'active') {
                admin.role = 'superadmin';
                admin.status = 'active';
                admin.email_verified = true;
                await admin.save();
                console.log('✅ Existing account promoted to Super Admin.');
            } else {
                console.log('ℹ️ Super Admin account already exists.');
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedSuperAdmin();
