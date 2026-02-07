// Script to update the user name in the database
import sequelize from '../config/database.js';
import User from '../models/User.js';

async function updateUserName() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // Update user with ID 1 (the main kaprodi user)
        const [updated] = await User.update(
            { nama_lengkap: 'Dr. Indra Surya Permana, MM., M.Kom.' },
            { where: { id: 1 } }
        );

        if (updated) {
            console.log('✅ User name updated successfully to: Dr. Indra Surya Permana, MM., M.Kom.');
        } else {
            console.log('⚠️ No user found with ID 1. Trying by username...');

            // Try by username kaprodi_informatika
            const [updated2] = await User.update(
                { nama_lengkap: 'Dr. Indra Surya Permana, MM., M.Kom.' },
                { where: { username: 'kaprodi_informatika' } }
            );

            if (updated2) {
                console.log('✅ User name updated successfully by username.');
            } else {
                console.log('❌ No user found with username kaprodi_informatika either.');
            }
        }

        // Show update result
        const user = await User.findOne({ where: { id: 1 } });
        if (user) {
            console.log('Current user data:', { id: user.id, username: user.username, nama_lengkap: user.nama_lengkap });
        }

    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await sequelize.close();
    }
}

updateUserName();
