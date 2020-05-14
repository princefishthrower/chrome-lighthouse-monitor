import cron from 'node-cron';
import env from "./env/.env.json";
import { launchChromeAndProcessLighthouseResponse } from './utils/utils';

// run lighthouse monitor once per day at 10:00
if (env.NODE_ENV === "DEVELOP") {
    console.log('Develop environment; running immediately');
    launchChromeAndProcessLighthouseResponse('https://chrisfrew.in')
} else {
    cron.schedule(
        '0 10 * * *',
        () => launchChromeAndProcessLighthouseResponse('https://chrisfrew.in')
    );
}


