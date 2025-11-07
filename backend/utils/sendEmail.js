const sgMail = require('@sendgrid/mail');

// Set the API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  try {
    // Ensure API key and sender details are configured
    if (!process.env.SENDGRID_API_KEY || !process.env.FROM_EMAIL || !process.env.FROM_NAME) {
        console.error("SendGrid API Key or From Email/Name missing in .env file!");
        throw new Error("Email service is not configured.");
    }

    let htmlContent = '';
    // Generate HTML content based on template
    // (Your existing switch statement for 'emailVerification', 'passwordReset', etc.)
    switch (options.template) {
      case 'emailVerification':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #006747, #F59741); padding: 30px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 26px; font-weight: bold;">Welcome to Edges Africa!</h1>
            </div>
            <div style="padding: 30px 20px; background: #ffffff;">
              <h2 style="color: #333; font-size: 20px; margin-top: 0;">Hi ${options.data.name},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                Thanks for joining! Please verify your email address to activate your account and start your learning journey. Click the button below:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${options.data.verificationUrl}"
                   style="background-color: #F59741; color: white; padding: 12px 25px; text-decoration: none;
                          border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px; border: none; cursor: pointer;">
                  Verify Email Address
                </a>
              </div>
              <p style="font-size: 14px; color: #777;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${options.data.verificationUrl}" style="color: #006747; text-decoration: underline;">${options.data.verificationUrl}</a>
              </p>
              <p style="font-size: 14px; color: #777;">
                This link will expire in 24 hours.
              </p>
            </div>
            <div style="background: #f4f4f4; padding: 15px 20px; text-align: center; border-top: 1px solid #ddd;">
              <p style="color: #777; margin: 0; font-size: 12px;">
                © 2025 Edges Africa. Empowering African Minds for Tomorrow.
              </p>
            </div>
          </div>
        `;
        break;

      case 'passwordReset':
         htmlContent = `... Your passwordReset HTML ...`; // Keep your password reset HTML
        break;

      default: // Fallback
        htmlContent = `<p>${options.message || 'Notification from Edges Africa'}</p>`;
    }

    // Construct the message object for SendGrid
    const msg = {
      to: options.email, // Recipient
      from: { // Verified sender or sender using authenticated domain
          email: process.env.FROM_EMAIL,
          name: process.env.FROM_NAME
      },
      subject: options.subject,
      html: htmlContent,
      // Optional: Add a text version for email clients that don't display HTML
      // text: 'Plain text content',
    };

    console.log("Attempting to send email via SendGrid..."); // Debug log
    const response = await sgMail.send(msg);
    console.log('Email sent successfully via SendGrid:', response[0].statusCode); // Log status code

    // SendGrid's send method doesn't return a messageId directly in the same way
    // The response array contains details, statusCode is usually 202 (Accepted)
    return {
      success: true,
      statusCode: response[0].statusCode
    };

  } catch (error) {
    console.error('SendGrid Error in sendEmail:', error); // Log the full SendGrid error
    // SendGrid errors often have details in error.response.body
    if (error.response) {
      console.error("SendGrid Error Body:", error.response.body);
    }
    throw new Error('Email could not be sent via SendGrid.'); // Re-throw generic error
  }
};

module.exports = sendEmail;