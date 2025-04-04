import { Router } from "express";
import { changePassword, getCurrentLocation, loginUser, logoutUser, refreshAccessToken, registerUser, resendOTP, resetPassword, sendResetOTP, updateUserAvatar, verifyOTP } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/register').post(registerUser);
router.route('/verifyOTP').post(verifyOTP);
router.route('/resendOTP').post(resendOTP);
router.route('/login').post(loginUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/sendResetOTP').post(sendResetOTP);
router.route('/reset-password').post(resetPassword);

// routes requiring verifyJWT
router.use( verifyJWT )
router.route('/logout').put(logoutUser);
router.route('/change-password').put(changePassword);
router.route('/update-avatar').put(verifyJWT,
    upload.single( 'avatar' ), updateUserAvatar )
router.route('/current-location').put(getCurrentLocation);

export default router;