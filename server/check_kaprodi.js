
import { User } from './models/index.js';

async function checkUser() {
    try {
        const user = await User.findOne({ where: { username: 'kaprodi_informatika' } });
        if (user) {
            console.log('User found:', user.username);
            console.log('Role:', user.role);
            console.log('Available Roles:', user.available_roles);
            console.log('Available Roles Type:', typeof user.available_roles);
        } else {
            console.log('User kaprodi_informatika not found');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUser();
