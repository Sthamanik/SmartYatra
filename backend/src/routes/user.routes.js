import { Router } from "express";
import { registerUser, resendOTP, verifyOTP } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

// router.route("/register").post(
//     upload.fields([
//         {
//             name: "avatar",
//             maxCount: 1
//         },
//     ]),
//     registerUser
// )

router.route('/register').post(registerUser);
router.route('/verifyOTP').post(verifyOTP);
router.route('/resendOTP').post(resendOTP)

export default router;