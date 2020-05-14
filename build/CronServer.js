"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const _env_json_1 = __importDefault(require("./env/.env.json"));
const utils_1 = require("./utils/utils");
// run lighthouse monitor once per day at 10:00
if (_env_json_1.default.NODE_ENV === "DEVELOP") {
    console.log('Develop environment; running immediately');
    utils_1.launchChromeAndProcessLighthouseResponse('https://chrisfrew.in');
}
else {
    node_cron_1.default.schedule('0 10 * * *', () => utils_1.launchChromeAndProcessLighthouseResponse('https://chrisfrew.in'));
}
