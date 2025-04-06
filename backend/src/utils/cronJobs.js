import cron from "node-cron";
import { User } from "../models/user.model.js";

const scheduleUserCleanupJobs = () => {
    // Run every day at midnight – delete users with deleteConfirmation = true
    cron.schedule("0 0 * * *", async () => {
        try {
            await User.cleanUpDeleteConfirmatinUsers();
        } catch (error) {
            console.error("❌ Error during delete-confirmation cleanup:", error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kathmandu"
    });

    // Run every 5 minutes – delete unverified users with too many attempts or old accounts
    cron.schedule("*/5 * * * *", async () => {
        try {
            await User.cleanupUnverifiedUsers();
        } catch (error) {
            console.error("❌ Error during unverified user cleanup:", error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kathmandu"
    });
};

export {
    scheduleUserCleanupJobs
};
