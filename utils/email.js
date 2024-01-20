const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // // how to do with gmail
  // // but keep in mind, gmail is not a good idea💀💀
  // // TODO: activate less secure options in google account to make this work
  // const transporter = nodemailer.createTransport({
  //   service: 'Gmail',
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASSWORD,
  //   },
  // });

  // create a transporter
  // transporter is a service that will actually send the email for us
  // we're gonna use mailtrap for this one
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // define email options
  const mailOptions = {
    from: 'Min Thant <marsjason485@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
