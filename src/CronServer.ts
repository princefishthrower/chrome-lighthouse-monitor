import cron from 'node-cron';
import env from "./env/.env.json";
import { launchChromeAndProcessLighthouseResponse } from './utils/utils';

const sites = ['https://chrisfrew.in', 'https://xn--seelengeflster-tirol-yec.com/'];


sites.forEach(site => {
    if (env.NODE_ENV === "DEVELOP") {
        console.log('Develop environment; running immediately');
        launchChromeAndProcessLighthouseResponse(site)
    } else {
        // run lighthouse monitor once per day at 10:00
        cron.schedule(
            '0 10 * * *',
            () => launchChromeAndProcessLighthouseResponse(site)
        );
    }
})



