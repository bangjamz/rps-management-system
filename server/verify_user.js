import { User } from './models/index.js';
import sequelize from './config/database.js';

const verify = async () => {
    try {
        const user = await User.findOne({ where: { username: 'testprofile' } });
        if (user) {
            user.email_verified = true;
            user.status = 'approved';
            await user.save();
            console.log('User verified and approved');
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
};

verify();
