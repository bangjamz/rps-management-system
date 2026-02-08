
import { User } from './models/index.js';

async function fixUser() {
    try {
        const user = await User.findOne({ where: { username: 'kaprodi_informatika' } });
        if (user) {
            console.log('User found:', user.username);
            user.available_roles = ['kaprodi', 'dosen'];
            await user.save();
            console.log('User updated. New available_roles:', user.available_roles);
        } else {
            console.log('User kaprodi_informatika not found');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

fixUser();
