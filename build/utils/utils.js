"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationEmail = exports.getLighthouseMetrics = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const Constants_1 = __importDefault(require("../constants/Constants"));
const chromeLauncher = require("chrome-launcher");
const lighthouse = require("lighthouse");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
function getLighthouseMetrics(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const chrome = yield chromeLauncher.launch();
        const opts = { port: chrome.port };
        const results = yield lighthouse(url, opts);
        yield chrome.kill();
        const categories = results.lhr.categories;
        const categoryKeys = Object.keys(categories);
        // Find all metrics below minimum score
        let failingCategories = [];
        categoryKeys.forEach((categoryKey) => {
            if (categories[categoryKey].score * 100 < Constants_1.default.MINIMUM_SCORE) {
                failingCategories.push(categories[categoryKey]);
            }
        });
        return failingCategories;
    });
}
exports.getLighthouseMetrics = getLighthouseMetrics;
function sendNotificationEmail(siteInformations) {
    return __awaiter(this, void 0, void 0, function* () {
        const accessToken = getAccessToken();
        const smtpTransport = nodemailer_1.default.createTransport({
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
            subject: "Lighthouse Monitor: One or More Metrics Have Dropped Below a Score of " +
                Constants_1.default.MINIMUM_SCORE,
            generateTextFromHTML: true,
            html: siteInformations
                .map((siteInformation) => {
                const categoryKeys = Object.keys(siteInformation.categories);
                return (siteInformation.url +
                    " metrics below value " +
                    Constants_1.default.MINIMUM_SCORE +
                    ":<br/><br/>" +
                    categoryKeys
                        .map((categoryKey) => {
                        return `${siteInformation.categories[categoryKey].title} - ${Math.round(siteInformation.categories[categoryKey].score * 100)}`;
                    })
                        .join("<br/>"));
            })
                .join("<br/><br/>"),
        };
        smtpTransport.sendMail(mailOptions, (error, response) => {
            smtpTransport.close();
        });
    });
}
exports.sendNotificationEmail = sendNotificationEmail;
function getAccessToken() {
    const oauth2Client = new OAuth2(process.env.CHRISFREW_IN_OAUTH_2_CLIENT_ID, process.env.CHRISFREW_IN_OAUTH_2_CLIENT_SECRET, "https://developers.google.com/oauthplayground");
    oauth2Client.setCredentials({
        refresh_token: process.env.CHRISFREW_IN_OAUTH_2_REFRESH_TOKEN,
    });
    return oauth2Client.getAccessToken();
}
