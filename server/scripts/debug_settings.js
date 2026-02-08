import sequelize from '../config/database.js';
import GlobalSettings from '../models/GlobalSettings.js';

const debugSettings = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        console.log('🔍 Fetching GlobalSettings (findOne)...');
        const settings = await GlobalSettings.findOne();
        if (!settings) {
            console.log('⚠️ No settings found. Attempting to create default...');
            settings = await GlobalSettings.create({
                nama_pt: 'Institut Teknologi dan Kesehatan Mahardika',
                default_lms_name: 'SIBEDA',
                default_lms_url: 'sibeda.mahardika.ac.id'
            });
            console.log('✅ Created default settings:', settings.toJSON());
        } else {
            console.log('✅ Settings found:', settings.toJSON());
        }
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

debugSettings();
