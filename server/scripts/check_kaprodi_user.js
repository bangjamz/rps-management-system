import sequelize from '../config/database.js';
import { User } from '../models/index.js';

async function checkKaprodiUser() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({
            where: {
                [sequelize.Sequelize.Op.or]: [
                    { username: { [sequelize.Sequelize.Op.iLike]: '%kaprodi%' } },
                    { email: { [sequelize.Sequelize.Op.iLike]: '%kaprodi%' } }
                ]
            },
            attributes: ['id', 'username', 'email', 'nama_lengkap', 'role', 'status']
        });
        console.log('Kaprodi Users Found:', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
checkKaprodiUser();
