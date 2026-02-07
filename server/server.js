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
import enrollmentRoutes from './routes/enrollment.js';
import analyticsRoutes from './routes/analytics.js';
import cplAnalyticsRoutes from './routes/cplAnalytics.js';
import notificationRoutes from './routes/notifications.js';
import academicYearRoutes from './routes/academicYears.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
            process.env.CLIENT_URL
        ].filter(Boolean);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins in development
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

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
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cpl-analytics', cplAnalyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/academic-years', academicYearRoutes);

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
            await sequelize.sync({ alter: true }); // Enabled alter to sync new columns
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
