const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const minimumScore = 95;

export function launchChromeAndProcessLighthouseResponse(
  url: string,
  opts = { port: "" },
  config = null
) {
  return chromeLauncher.launch().then((chrome: any) => {
    opts.port = chrome.port;
    return lighthouse(url, opts, config).then((results: any) => {
      //   return chrome.kill().then(() => results.lhr)
      return chrome.kill().then(() => {
        let metrics: Array<string> = [];
        const categories = results.lhr.categories;
        const categoryKeys = Object.keys(categories);
        categoryKeys.forEach((categoryKey) => {
          if (categories[categoryKey].score * 100 < minimumScore) {
            metrics.push(categories[categoryKey].title);
          }
        });
        if (metrics.length > 0) {
          sendNotificationEmail(url, metrics);
        }
      });
    });
  });
}

function sendNotificationEmail(url: string, metrics: Array<string>) {
  const accessToken = getAccessToken();
  const smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "frewin.christopher@gmail.com",
      clientId: process.env.CHRISFREW_IN_OAUTH_2_CLIENT_ID,
      clientSecret: process.env.CHRISFREW_IN_OAUTH_2_CLIENT_SECRET,
      refreshToken: process.env.CHRISFREW_IN_OAUTH_2_REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });

  const mailOptions = {
    from: "frewin.christopher@gmail.com",
    to: "frewin.christopher@gmail.com",
    subject:
      "One or More Lighthouse Metrics Have Dropped Below a Score of " +
      minimumScore,
    generateTextFromHTML: true,
    html:
      "The following metrics for " +
      url +
      " have fallen below a score of " +
      minimumScore +
      ":<br/><br/>" +
      metrics.join(", "),
  };

  smtpTransport.sendMail(mailOptions, (error: any, response: any) => {
    smtpTransport.close();
  });
}

function getAccessToken() {
  const oauth2Client = new OAuth2(
    process.env.CHRISFREW_IN_OAUTH_2_CLIENT_ID, // ClientID
    process.env.CHRISFREW_IN_OAUTH_2_CLIENT_SECRET, // Client Secret
    "https://developers.google.com/oauthplayground" // Redirect URL
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.CHRISFREW_IN_OAUTH_2_REFRESH_TOKEN,
  });
  return oauth2Client.getAccessToken();
}
