import cron from "node-cron";
import { User } from "../models/user.model.js";

const scheduleUserCleanupBasedOnDeleteConfirmation = () => {
    cron.schedule("0 0 * * *", async () => {
        try {
            const deletedUsers = await User.cleanUpDeleteConfirmatinUsers();
            logger.info(`User cleanup job executed. Deleted users: ${deletedUsers.deletedCount}`);
        } catch (error) {
            logger.error("Error during user cleanup:", error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kathmandu" // Set the timezone if needed
    });
};

export {
    scheduleUserCleanupBasedOnDeleteConfirmation
}