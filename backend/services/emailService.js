const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Email templates
const emailTemplates = {
    purchaseConfirmation: (user, course, payment) => ({
        subject: `Welcome to ${course.title}!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">Welcome to SkillSharp365!</h1>
                <p>Hi ${user.name},</p>
                <p>Thank you for purchasing <strong>${course.title}</strong>!</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Course Details:</h3>
                    <p><strong>Course:</strong> ${course.title}</p>
                    <p><strong>Instructor:</strong> ${course.instructor?.name}</p>
                    <p><strong>Amount Paid:</strong> $${(payment.amount / 100).toFixed(2)}</p>
                    <p><strong>Purchase Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
                </div>
                <p>You now have full access to the course content. Start learning today!</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL}/learn/${course._id}"
                       style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        Start Learning Now
                    </a>
                </div>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Happy learning!</p>
                <p>The SkillSharp365 Team</p>
            </div>
        `
    }),

    refundConfirmation: (user, course, payment, refundAmount) => ({
        subject: `Refund Processed for ${course.title}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #dc2626;">Refund Processed</h1>
                <p>Hi ${user.name},</p>
                <p>Your refund request for <strong>${course.title}</strong> has been processed.</p>
                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Refund Details:</h3>
                    <p><strong>Course:</strong> ${course.title}</p>
                    <p><strong>Refund Amount:</strong> $${(refundAmount / 100).toFixed(2)}</p>
                    <p><strong>Processed Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <p>The refund will appear in your original payment method within 5-10 business days.</p>
                <p>If you have any questions about this refund, please contact our support team.</p>
                <p>Best regards,</p>
                <p>The SkillSharp365 Team</p>
            </div>
        `
    }),

    refundRequestReceived: (user, course, payment) => ({
        subject: `Refund Request Received for ${course.title}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #f59e0b;">Refund Request Received</h1>
                <p>Hi ${user.name},</p>
                <p>We've received your refund request for <strong>${course.title}</strong>.</p>
                <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Request Details:</h3>
                    <p><strong>Course:</strong> ${course.title}</p>
                    <p><strong>Amount:</strong> $${(payment.amount / 100).toFixed(2)}</p>
                    <p><strong>Request Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <p>Our team will review your request and process it within 3-5 business days. You'll receive another email once the refund is processed.</p>
                <p>Thank you for your patience.</p>
                <p>Best regards,</p>
                <p>The SkillSharp365 Team</p>
            </div>
        `
    })
};

// Send email function
const sendEmail = async (to, templateName, data) => {
    try {
        const transporter = createTransporter();
        const template = emailTemplates[templateName];

        if (!template) {
            throw new Error(`Email template '${templateName}' not found`);
        }

        const emailContent = template(...data);

        const mailOptions = {
            from: `"SkillSharp365" <${process.env.EMAIL_USER}>`,
            to,
            subject: emailContent.subject,
            html: emailContent.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendEmail,
    emailTemplates
};
