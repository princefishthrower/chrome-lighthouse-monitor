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
const node_cron_1 = __importDefault(require("node-cron"));
const _env_json_1 = __importDefault(require("./env/.env.json"));
const utils_1 = require("./utils/utils");
const Constants_1 = __importDefault(require("./constants/Constants"));
if (_env_json_1.default.NODE_ENV === "DEVELOP") {
    console.log("Develop environment; running immediately");
    processSites();
}
else {
    // run lighthouse monitor once per day at 10:00
    node_cron_1.default.schedule("15 10 * * *", processSites);
}
// Synchronously loops through all sites in SITES_TO_AUDIT, running chrome's lighthouse for each
function processSites() {
    return __awaiter(this, void 0, void 0, function* () {
        // NOTE: this must be a synchronous function, thus the for-in loop
        // You can't run the same instance of chrome for multiple sites at a time.
        let siteInformations = [];
        for (const index in Constants_1.default.SITES_TO_AUDIT) {
            const categories = yield utils_1.getLighthouseMetrics(Constants_1.default.SITES_TO_AUDIT[index]);
            if (categories.length > 0) {
                siteInformations.push({
                    url: Constants_1.default.SITES_TO_AUDIT[index],
                    categories,
                });
            }
        }
        // Send email only if metrics below minimum score found
        if (siteInformations.length > 0) {
            if (_env_json_1.default.NODE_ENV === "DEVELOP") {
                console.log(`Found at least one metric below score ${Constants_1.default.MINIMUM_SCORE} across all sites; sending email...`);
            }
            yield utils_1.sendNotificationEmail(siteInformations);
            if (_env_json_1.default.NODE_ENV === "DEVELOP") {
                console.log("Email successfully sent.");
            }
        }
        else {
            if (_env_json_1.default.NODE_ENV === "DEVELOP") {
                console.log(`No metrics below ${Constants_1.default.MINIMUM_SCORE}, across all sites nice!`);
            }
        }
    });
}
