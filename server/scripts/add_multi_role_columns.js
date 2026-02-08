import sequelize from '../config/database.js';

const addMultiRoleColumns = async () => {
    try {
        console.log('Starting migration: Adding multi-role columns...');

        // Add available_roles column to users
        await sequelize.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS available_roles JSONB DEFAULT NULL;
        `);
        console.log('✓ Added available_roles column');

        // Add angkatan column to users
        await sequelize.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS angkatan VARCHAR(10) DEFAULT NULL;
        `);
        console.log('✓ Added angkatan column');

        // Create mk_aktifs table for course distribution
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS mk_aktifs (
                id SERIAL PRIMARY KEY,
                mata_kuliah_id INTEGER NOT NULL REFERENCES mata_kuliah(id),
                prodi_id INTEGER NOT NULL REFERENCES prodi(id),
                tahun_akademik_id INTEGER NOT NULL REFERENCES academic_years(id),
                semester VARCHAR(10) NOT NULL CHECK (semester IN ('Ganjil', 'Genap')),
                angkatan_target JSONB DEFAULT '[]',
                dosen_pengampu_id INTEGER REFERENCES users(id),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('✓ Created mk_aktifs table');

        // Create index for faster lookups
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_mk_aktifs_prodi_semester 
            ON mk_aktifs(prodi_id, tahun_akademik_id, semester);
        `);
        console.log('✓ Created mk_aktifs indexes');

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

addMultiRoleColumns();
