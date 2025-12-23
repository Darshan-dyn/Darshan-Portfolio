const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files (resumes, images, etc.)

// Nodemailer Configuration
// Nodemailer Configuration
const transporter = nodemailer.createTransport({  // ← 'Transport' 
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 5,
    rateDelta: 1000 * 60 * 10,
    rateLimit: 5
});


// ========== CONTACT FORM ENDPOINT ==========
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        // Email to Owner (You)
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.OWNER_EMAIL,
            subject: `New Contact from Portfolio: ${subject || 'No subject'}`,
            html: `
                <h2>📧 New Contact from Portfolio</h2>
                <p><b>Name / Company:</b> ${name}</p>
                <p><b>Email:</b> ${email}</p>
                <p><b>Subject:</b> ${subject || 'No subject'}</p>
                <p><b>Message:</b><br>${message.replace(/\n/g, '<br>')}</p>
                <hr>
                <p style="color: #666; font-size: 12px;">Sent from your portfolio contact form</p>
            `
        });

        // Confirmation Email to Visitor (Recruiter)
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Thank you for contacting me',
            html: `
        <p>Hi ${name},</p>

        <p>
            Thank you for contacting me regarding 
            <b>${subject || 'your opportunity'}</b>.
            I have successfully received your message.
        </p>

        <p>
            I appreciate your interest and will review your message carefully.
            I will respond at the earliest possible time.
        </p>

        <h3>Your Message</h3>
        <div style="background-color:#f5f5f5; padding:15px; border-radius:6px;">
            <p>${message.replace(/\n/g, '<br>')}</p>
        </div>

        <hr>
        <p>
            Best regards,<br>
            <b>Darshan Y N</b>
        </p>
        <p style="color:#666; font-size:12px;">
            My Portfolio: https://darshan-portfolio-ebon.vercel.app/
        </p>
    `
        });

        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (err) {
        console.error('Email Error:', err);
        res.status(500).json({ success: false, message: 'Failed to send email: ' + err.message });
    }
});

// ========== RESUME DOWNLOAD ENDPOINT ==========
app.get('/api/resume/download', (req, res) => {
    try {
        // Path to resume file
        const resumePath = path.join(__dirname, 'public', 'Darshan_YN_Resume.pdf');

        // Check if file exists
        if (!fs.existsSync(resumePath)) {
            return res.status(404).json({
                success: false,
                message: 'Resume file not found. Please upload it to public/Darshan_YN_Resume.pdf'
            });
        }

        // Set headers for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Darshan_YN_Resume.pdf"');

        // Send file
        const fileStream = fs.createReadStream(resumePath);
        fileStream.pipe(res);

        fileStream.on('error', (err) => {
            console.error('File streaming error:', err);
            res.status(500).json({ success: false, message: 'Error downloading resume' });
        });

    } catch (err) {
        console.error('Resume download error:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// ========== RESUME PREVIEW ENDPOINT (Optional) ==========
app.get('/api/resume/preview', (req, res) => {
    try {
        const resumePath = path.join(__dirname, 'public', 'Darshan_YN_Resume.pdf');

        if (!fs.existsSync(resumePath)) {
            return res.status(404).json({
                success: false,
                message: 'Resume not found'
            });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="Darshan_YN_Resume.pdf"');

        const fileStream = fs.createReadStream(resumePath);
        fileStream.pipe(res);

    } catch (err) {
        console.error('Resume preview error:', err);
        res.status(500).json({ success: false, message: 'Error previewing resume' });
    }
});

// ========== HEALTH CHECK ENDPOINT ==========
app.get('/', (req, res) => {
    res.json({
        status: 'Backend is running',
        endpoints: {
            contact: 'POST /api/contact',
            resumeDownload: 'GET /api/resume/download',
            resumePreview: 'GET /api/resume/preview'
        }
    });
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`
    ========================================
    🚀 Server running on http://localhost:${PORT}
    📧 Contact API: POST /api/contact
    📄 Resume Download: GET /api/resume/download
    📄 Resume Preview: GET /api/resume/preview
    ========================================
    `);
});
