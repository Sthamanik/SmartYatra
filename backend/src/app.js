import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { scheduleUserCleanupBasedOnDeleteConfirmation } from "./utils/cronJobs.js";

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials: true    
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from './routes/user.routes.js'
import driverRouter from './routes/driver.routes.js'


// routes declaration
app.use("/api/v1/users", userRouter)
app.use('/api/v1/driver', driverRouter)

// cron jobs
scheduleUserCleanupBasedOnDeleteConfirmation();

export {app}