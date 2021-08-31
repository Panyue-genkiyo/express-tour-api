//用node去发邮件
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1.create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
    //less secure app option
  });

  // 2.defined the email option
  const mailOptions = {
    from: 'panyue <90938238g@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html
  };

  // 3.actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
