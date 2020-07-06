import cron from "node-cron";
import env from "./env/.env.json";
import { getLighthouseMetrics, sendNotificationEmail } from "./utils/utils";
import Constants from "./constants/Constants";

if (env.NODE_ENV === "DEVELOP") {
  console.log("Develop environment; running immediately");
  processSites();
} else {
  // run lighthouse monitor once per day at 10:00
  cron.schedule("59 12 * * *", processSites);
}

// Synchronously loops through all sites in SITES_TO_AUDIT, running chrome's lighthouse for each
async function processSites() {
  // NOTE: this must be a synchronous function, thus the for-in loop
  // You can't run the same instance of chrome for multiple sites at a time.
  let siteInformations: Array<any> = [];
  for (const index in Constants.SITES_TO_AUDIT) {
    const categories = await getLighthouseMetrics(Constants.SITES_TO_AUDIT[index]);
    if (categories.length > 0) {
      siteInformations.push({
        url: Constants.SITES_TO_AUDIT[index],
        categories,
      });
    }
  }

  // Send email only if metrics below minimum score found
  if (siteInformations.length > 0) {
    if (env.NODE_ENV === "DEVELOP") {
      console.log(
        `Found at least one metric below score ${Constants.MINIMUM_SCORE} across all sites; sending email...`
      );
    }
    await sendNotificationEmail(siteInformations);
    if (env.NODE_ENV === "DEVELOP") {
      console.log("Email successfully sent.");
    }
  } else {
    if (env.NODE_ENV === "DEVELOP") {
      console.log(
        `No metrics below ${Constants.MINIMUM_SCORE}, across all sites nice!`
      );
    }
  }
}
