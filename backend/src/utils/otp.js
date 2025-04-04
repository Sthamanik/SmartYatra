import axios from 'axios';

export const sendOTPEmail = async (email, otp) => {
    const API_KEY = process.env.BREVO_API_KEY;  // Load the API key from environment variables

    const url = 'https://api.brevo.com/v3/smtp/email';  // Brevo API URL for sending emails

    // Define the expiry time (2 minutes from now)
    const expiryTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiry
    const formattedExpiryTime = expiryTime.toLocaleTimeString();  // Format expiry time to a string (you can customize as needed)

    // Craft the email content with OTP and expiry time
    const emailContent = `
        <p>Your OTP code is: <strong>${otp}</strong>.</p>
        <p>This code will expire at <strong>${formattedExpiryTime}</strong>.</p>
        <p>Please use it promptly.</p>
    `;

    const data = {
        sender: { email: process.env.SENDER },  // Sender's email address (use your verified Brevo sender email)
        to: [{ email: email }],  // Recipient's email address
        subject: 'Your OTP Code',
        htmlContent: emailContent,  // The HTML content for the email
    };

    const headers = {
        'Content-Type': 'application/json',
        'api-key': API_KEY,  // Use the API key for authentication
    };

    try {
        const response = await axios.post(url, data, { headers });
        console.log('OTP email sent successfully:', response.data);  // Log the response from Brevo
        return response;
    } catch (error) {
        console.error('Error sending OTP email:', error.response ? error.response.data : error.message);
    }
};
