import { Router } from "express";
import { changePassword, loginUser, logoutUser, refreshAccessToken, registerUser, resendOTP, resetPassword, sendResetOTP, updateUserAvatar, verifyOTP } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// routes with post method
router.route('/register').post(registerUser);
router.route('/verifyOTP').post(verifyOTP);
router.route('/resendOTP').post(resendOTP);
router.route('/login').post(loginUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/sendResetOTP').post(sendResetOTP);
router.route('reset-password').post(resetPassword);

// routes with put method
router.route('/logout').put(verifyJWT, logoutUser);
router.route('/change-password').put(verifyJWT, changePassword);
router.route('/update-avatar').put(
    upload.fields(
        {
            name: "avatar",
            maxCount: 1
    }),verifyJWT, updateUserAvatar )

export default router;