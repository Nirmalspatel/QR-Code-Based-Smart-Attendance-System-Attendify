import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const mailOptions = {
  from: process.env.EMAIL,
  to: process.env.EMAIL, // Send to self for testing
  subject: 'SMTP Test',
  text: 'If you see this, SMTP is working!',
};

console.log('Testing with EMAIL:', process.env.EMAIL);

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('SMTP Error:', error.message);
    if (error.message.includes('Invalid login')) {
      console.log('\n--- TIP ---');
      console.log('1. Ensure 2-Step Verification is ON in your Google Account.');
      console.log('2. Create an "App Password" (Search for it in Google Account settings).');
      console.log('3. Use the 16-character App Password in your .env file, NOT your regular password.');
    }
  } else {
    console.log('Email sent successfully:', info.response);
  }
});
