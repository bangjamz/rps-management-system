import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import authRoutes from './routes/auth.js';
import curriculumRoutes from './routes/curriculum.js';
import coursesRoutes from './routes/courses.js';
import organizationRoutes from './routes/organization.js';
import dashboardRoutes from './routes/dashboard.js';
import lecturerAssignmentsRoutes from './routes/lecturerAssignments.js';
import rpsRoutes from './routes/rps.js';
import gradingRoutes from './routes/grading.js';
import attendanceRoutes from './routes/attendance.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/lecturer-assignments', lecturerAssignmentsRoutes);
app.use('/api/rps', rpsRoutes);
app.use('/api/grading', gradingRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'RPS Maker API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Sync models (without force in production)
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: false });
            console.log('✅ Database models synchronized');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📍 API URL: http://localhost:${PORT}/api`);
            console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Unable to start server:', error);
        process.exit(1);
    }
};

startServer();
