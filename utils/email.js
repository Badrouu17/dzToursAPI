const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const sgMail = require('@sendgrid/mail');

const mailgun = require('mailgun-js');
const mg = mailgun({
  apiKey: process.env.MAILGUN_API,
  domain: process.env.MAILGUN_DOMAIN
});

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Badreddin laabed <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendGrid(template, subject) {
    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    sgMail.setApiKey(process.env.SENDGRID_PASSWORD);

    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    const msg = {
      to: this.to,
      from: this.from,
      subject: 'passwordReset',
      text: htmlToText.fromString(html),
      html
    };
    await sgMail.send(msg);
  }

  async sendGun(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    const msg = {
      to: this.to,
      from: this.from,
      subject: 'passwordReset',
      text: htmlToText.fromString(html),
      html
    };
    await mg.send(msg);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    if (process.env.NODE_ENV === 'production') {
      await this.sendGun(
        'passwordReset',
        'Your password reset token (valid for only 10 minutes)'
      );
    } else {
      await this.send(
        'passwordReset',
        'Your password reset token (valid for only 10 minutes)'
      );
    }
  }
};
