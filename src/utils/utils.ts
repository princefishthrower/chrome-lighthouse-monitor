import nodemailer from "nodemailer";
import ISiteInformation from "../interfaces/ISiteInformation";
import Constants from "../constants/Constants";

const chromeLauncher = require("chrome-launcher");
const lighthouse = require("lighthouse");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

export async function getLighthouseMetrics(url: string): Promise<Array<any>> {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless']
  });
  const opts = { port: chrome.port };
  const results = await lighthouse(url, opts);
  await chrome.kill();
  const categories = results.lhr.categories;
  const categoryKeys = Object.keys(categories);

  // Find all metrics below minimum score
  let failingCategories: Array<any> = [];
  categoryKeys.forEach((categoryKey) => {
    if (categories[categoryKey].score * 100 < Constants.MINIMUM_SCORE) {
      failingCategories.push(categories[categoryKey]);
    }
  });
  return failingCategories;
}

export async function sendNotificationEmail(
  siteInformations: Array<ISiteInformation>
): Promise<void> {
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
      "Lighthouse Monitor: One or More Metrics Have Dropped Below a Score of " +
      Constants.MINIMUM_SCORE,
    generateTextFromHTML: true,
    html: siteInformations
      .map((siteInformation: ISiteInformation) => {
        const categoryKeys = Object.keys(siteInformation.categories);
        return (
          siteInformation.url +
          " metrics below value " +
          Constants.MINIMUM_SCORE +
          ":<br/><br/>" +
          categoryKeys
            .map((categoryKey: any) => {
              return `${siteInformation.categories[categoryKey].title} - ${
                Math.round(siteInformation.categories[categoryKey].score * 100)
              }`;
            })
            .join("<br/>")
        );
      })
      .join("<br/><br/>"),
  };

  smtpTransport.sendMail(mailOptions, (error: any, response: any) => {
    smtpTransport.close();
  });
}

function getAccessToken() {
  const oauth2Client = new OAuth2(
    process.env.CHRISFREW_IN_OAUTH_2_CLIENT_ID,
    process.env.CHRISFREW_IN_OAUTH_2_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.CHRISFREW_IN_OAUTH_2_REFRESH_TOKEN,
  });
  return oauth2Client.getAccessToken();
}
