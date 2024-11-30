import { createTransport, SendMailOptions } from "nodemailer";

const sendEmail = async (options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) => {
  const transporter = createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions: SendMailOptions = {
    from: `Thanh Dev <${process.env.EMAIL_USERNAME}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  // Send the email
  return transporter.sendMail(mailOptions);
};

export default sendEmail;
