import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser, resendOTP, verifyOTP } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

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
router.route('/resendOTP').post(resendOTP);
router.route('/login').post(loginUser);
router.route('/logout').put(verifyJWT, logoutUser);
router.route('/refresh-token').post(refreshAccessToken);

export default router;