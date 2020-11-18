const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_APIKEY);

const sendEmail = async (options) => {
  console.log(options.message);
  const msg = {
    to: options.email, // Change to your recipient
    from: process.env.SENDGRID_FROM, // Change to your verified sender
    subject: options.subject,
    text: options.message,
    html: `<p>${options.message}</p>`,
  };
  try {
    const send = await sgMail.send(msg);
    console.log("Email sent");
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendEmail;
