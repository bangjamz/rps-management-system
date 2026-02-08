import sequelize from './config/database.js';
import { User, UserProfile, Institusi, Fakultas, Prodi, Dosen, Mahasiswa } from './models/index.js';

const syncDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Sync all models with alter: true to add missing columns
        await sequelize.sync({ alter: true });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
};

syncDatabase();
