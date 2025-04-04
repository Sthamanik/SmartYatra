import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { sendOTPEmail } from "../utils/otp.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

// cookie option if needed
const options = {
    httpOnly: true,
    secure: true,
}

const generateOTP = () => {
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);  
    return otp.toString(); 
};

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Error generating access and refresh token")
    }
}

// Register User with OTP Verification
const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, password, phone, DOB } = req.body;
    console.log(req.body)

    // Validate required fields
    if ([fullname, email, password, phone, DOB ].some((field) => field?.trim() === ""))
        throw new ApiError(400, "All fields are required");

    // Check if user already exists (email or phone)
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
        throw new ApiError(409, "User with this email or phone already exists");
    }

    // Generate OTP and expiration time
    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + process.env.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Create user (unverified initially)
    const user = await User.create({
        fullname,
        email,
        password,
        phone,
        DOB,
        otp: { code: otpCode, expiredAt: otpExpiresAt }
    });

    // Send OTP via email
    // const otpSent = await sendOTPEmail(email, otpCode);
    // if (!otpSent) {
    //     throw new ApiError(500, "Failed to send OTP. Try again later.");
    // } 

    // Return response without sensitive data
    const createdUser = await User.findById(user._id).select("-password -otp -otpAttempts -otpResendAttempts");
    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully. Verify OTP to complete registration."));
});

// Verify OTP
const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    // Validate inputs
    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required.");
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    // Check if OTP expired
    if (new Date() > user.otp.expiredAt) {
        throw new ApiError(400, "OTP expired. Please resend again.");
    }

    // Check OTP
    if (user.otp.code !== otp) {
        user.otpAttempts += 1;
        await user.save({validateBeforeSave: false});

        if (user.otpAttempts >= 5) {
            await User.deleteOne({ email });
            throw new ApiError(400, "Too many failed attempts. Please register again.");
        }

        throw new ApiError(400, `Incorrect OTP. ${5 - user.otpAttempts} attempts left.`);
    }

    // OTP verified -> Mark user as verified
    user.isVerified = true;
    user.otp = { code: null, expiredAt: null };
    user.otpAttempts = 0;
    user.otpResendAttempts = 0;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, null, "OTP verified successfully!"));
});

// Resend OTP
const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required.");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    if (user.isVerified) {
        throw new ApiError(400, "User is already verified.");
    }

    if (user.otpResendAttempts >= 3) {
        await User.deleteOne({ email });
        throw new ApiError(400, "Too many OTP requests. Please register again.");
    }

    // Generate new OTP
    const newOtp = generateOTP();
    user.otp.code = newOtp;
    user.otp.expiredAt = new Date(Date.now() + process.env.OTP_EXPIRY_MINUTES * 60 * 1000);
    user.otpResendAttempts += 1;
    await user.save({validateBeforeSave: false});

    // Send new OTP
    const otpSent = await sendOTPEmail(email, newOtp);
    if (!otpSent) {
        throw new ApiError(500, "Failed to send OTP. Try again later.");
    }

    return res.status(200).json(new ApiResponse(200, null, `New OTP sent. ${3 - user.otpResendAttempts} attempts left.`));
});

// login the user
const loginUser = asyncHandler ( async (req , res) => {
    // get the user credentials
    const {email, password} = req.body;

    if (!email ||!password) {
        throw new ApiError(400, "All credentials are required");
    }

    // check if user exists or not
    const user = await User.findOne({email});
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (!user?.isVerified){
        throw new ApiError(400, "User is not verified. Verify your email first.");
    }

    // if user exists, validate password
    const isPassValid = await user.isPasswordCorrect ( password );

    if (!isPassValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // if validated, generate access and refreshh tokens
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedinUser = await User.findById(user._id).select("-password -otp -otpAttempts -otpResendAttempts");

    // store the token in secured cookies and return the response
    return res.status(200)
    .cookie( "accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200,
        {
            user: loggedinUser,
            accessToken,
            refreshToken
        },
        "User logged in successfully"));
})

// logout the user
const logoutUser = asyncHandler (async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        { new: true }
    )

    // clear access and refresh tokens from cookies and send response
    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json (
        new ApiResponse(
            200,
            null,
            "User logged out successfully"
        )
    )
})

// refresh the expired accesstoken
const refreshAccessToken = asyncHandler ( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    try {
        // validate the refresh token
        const decodedToken = jwt.verify( incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        // check if the user still exists and the refresh token hasn't expired
        const user = await User.findById(decodedToken._id);
        if (!user || !user.refreshToken || user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Invalid or expired refresh token. Please log in again.");
        }        
    
        // generate new access token
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
        
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json( 
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        console.error("Error refreshing access token:", error);
        throw new ApiError(500,error?.message || "Failed to refresh access token. Please try again.");
    }
})

// change the current password of the user
const changePassword = asyncHandler( async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // check if the current password is correct
    const user = await User.findById( req.user?._id);
    const isPassValid = await user.isPasswordCorrect( currentPassword ); 

    if (!isPassValid) {
        throw new ApiError(401, "Invalid current password");
    }

    if ( currentPassword === newPassword ) {
        throw new ApiError(400, "New password should not match the current password");
    }

    // update the user's password
    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
})

// get current user
const getCurrentUser = asyncHandler( async (req, res) => {
    return res.status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "User information retrieved successfully"
        )
    )
})

// change your avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user){
        throw new ApiError(401, "User not authenticated");
    }

    const avatarLocalPath = req.file?.path
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // upload them to cloudinary server
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url){
        throw new ApiError(500, "Failed to upload avatar to cloudinary");
    }

    // update the user's avatar
    user.avatar = avatar.url;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, null, "Avatar uploaded Successfully"));
})

// reset the password if user forget their password
const sendResetOTP = asyncHandler( async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // send the otp to the email
    const resetOTP = generateOTP();
    const otpExpiresAt = new Date(Date.now() + process.env.OTP_EXPIRY_MINUTES * 60 * 1000);

    // update the user's otp and otp expiry
    const user = await User.findOneAndUpdate(
        { email },
        {
            $set: {
                otp: { code: resetOTP, expiredAt: otpExpiresAt }
            }
        },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // send the otp to the user's email
    const otpSent = await sendOTPEmail(email, resetOTP);
    if (!otpSent) {
        throw new ApiError(500, "Failed to send OTP. Try again later.");
    }

    return res.status(200).json(new ApiResponse(200, null, "Reset OTP sent successfully"));

})

// reset the password if user confirm their otp
const resetPassword = asyncHandler( async( req, res) => {
    const { email, password, otp } = req.body;
    if (!email ||!password ||!otp) {
        throw new ApiError(400, "All credentials are required");
    }

    // check if user exists and otp is valid
    const user = await User.findOne({email});
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isOtpValid = user.otp?.code === otp && user.otp?.expiredAt > new Date();
    if (!isOtpValid) {
        throw new ApiError(401, "Invalid OTP or OTP expired");
    }

    // update the user's password and set otp code and expiry to null
    user.otp = { code: null, expiredAt: null };
    user.password =  password;
    user.refreshToken = null;
    await user.save({validateBeforeSave: false});

    return res.status(200).json(new ApiResponse(200, null, "Password reset successfully"));
})

const getCurrentLocation = asyncHandler(async (req, res) => {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        throw new ApiError(400, "Valid latitude and longitude are required.");
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new ApiError(400, "Latitude must be between -90 and 90, and longitude between -180 and 180.");
    }

    // Assuming user is authenticated and their ID is in req.user
    const userId = req.user._id;
    
    if( !userId ){
        throw new ApiError(401, "User not authenticated");
    }

    // Update user location in MongoDB
    const user = await User.findByIdAndUpdate(userId, {
        $set: { 
            currentLocation: { 
                type: "Point", 
                coordinates: [longitude, latitude] 
            }
        }
    },{new : true});

    if(!user){
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(new ApiResponse(200, null, "Location updated successfully"));
});

const sendDeleteVerification = asyncHandler ( async (req, res) => {
    const user = req.user;
    const password = req.body;

    if ( !user ){
        throw new ApiError(404, "User not found");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    const isPassValid = await user.isPasswordCorrect(password);
    if (!isPassValid) {
        throw new ApiError(401, "Enter the valid password to proceed");
    }

    user.deleteConfirmation = true;
    await user.save({validateBeforeSave: false});


})

export { 
    registerUser, 
    verifyOTP, 
    resendOTP,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateUserAvatar,
    sendResetOTP,
    resetPassword,
    getCurrentLocation,
    sendDeleteVerification
};