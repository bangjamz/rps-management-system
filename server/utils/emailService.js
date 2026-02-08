import nodemailer from 'nodemailer';

// Configure transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.warn('⚠️ SMTP Connection Warning:', error.message);
    } else {
        console.log('✅ SMTP Server is ready to take our messages');
    }
});

const sendVerificationEmail = async (user, token) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ Email credentials not set. Skipping email send for:', user.email);
        console.log(`🔗 Verification Link: ${process.env.CLIENT_URL}/verify-email?token=${token}`);
        return;
    }

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: `"${process.env.APP_NAME || 'RPS System'}" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Verifikasi Email Akun RPS',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Selamat Datang di Sistem RPS!</h2>
                <p>Halo ${user.nama_lengkap},</p>
                <p>Terima kasih telah mendaftar. Silakan klik tombol di bawah ini untuk memverifikasi email Anda:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px; font-weight: bold;">Verifikasi Email</a>
                </div>
                <p>Atau salin tautan berikut ke browser Anda:</p>
                <p>${verificationLink}</p>
                <p>Tautan ini akan kedaluwarsa dalam 24 jam.</p>
                <br>
                <p>Salam,</p>
                <p>Tim IT Kampus</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Verification email sent to ${user.email}`);
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        throw error;
    }
};

const sendApprovalNotification = async (user) => {
    if (!process.env.SMTP_USER) return;

    try {
        await transporter.sendMail({
            from: `"${process.env.APP_NAME || 'RPS System'}" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: 'Akun Anda Telah Disetujui!',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Selamat! Akun Anda Telah Aktif.</h2>
                    <p>Halo ${user.nama_lengkap},</p>
                    <p>Akun Anda dengan role <strong>${user.role.toUpperCase()}</strong> telah disetujui oleh Administrator.</p>
                    <p>Sekarang Anda dapat mengakses fitur-fitur sesuai hak akses Anda.</p>
                    <br>
                    <a href="${process.env.CLIENT_URL}/login">Login Sekarang</a>
                </div>
            `
        });
    } catch (error) {
        console.error('Error sending approval email:', error);
    }
};

export {
    sendVerificationEmail,
    sendApprovalNotification
};
