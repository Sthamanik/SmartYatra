import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { sendOTPEmail } from "../utils/otp.js";

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

// ✅ Register User with OTP Verification
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
    // try {
    //     const otpSent = await sendOTPEmail(email, otpCode);
    //     if (!otpSent) {
    //         await User.deleteOne({ _id: user._id }); // Remove user if OTP fails
    //         throw new ApiError(500, "Failed to send OTP. Please try again.");
    //     }
    // } catch (error) {
    //     console.error("Error sending OTP email:", error);
    //     await User.deleteOne({ _id: user._id });  // Remove user if error occurs while sending OTP
    //     throw new ApiError(500, "Failed to send OTP. Please try again.");
    // }

    // Return response without sensitive data
    const createdUser = await User.findById(user._id).select("-password -otp -otpAttempts -otpResendAttempts");
    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully. Verify OTP to complete registration."));
});

// ✅ Verify OTP
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
        await User.deleteOne({ email });
        throw new ApiError(400, "OTP expired. Please register again.");
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

// ✅ Resend OTP
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
        await User.deleteOne({ phone });
        throw new ApiError(400, "Too many OTP requests. Please register again.");
    }

    // Generate new OTP
    const newOtp = generateOTP();
    user.otp.code = newOtp;
    user.otp.expiredAt = new Date(Date.now() + process.env.OTP_EXPIRY_MINUTES * 60 * 1000);
    user.otpResendAttempts += 1;
    await user.save();

    // Send new OTP
    // const otpSent = await sendOTPEmail(phone, newOtp);
    // if (!otpSent) {
    //     throw new ApiError(500, "Failed to send OTP. Try again later.");
    // }

    return res.status(200).json(new ApiResponse(200, null, `New OTP sent. ${4 - user.otpResendAttempts} attempts left.`));
});

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

const logoutUser = asyncHandler (async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null
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

// const uploadAvatar = asyncHandler(async (req, res) => {
//      const avatarLocalPath = req.files?.avatar[0]?.path
//      if (!avatarLocalPath) {
//          throw new ApiError(400, "Avatar file is required");
//      }
 
//      // upload them to cloudinary server
//      const avatar = await uploadOnCloudinary(avatarLocalPath);
//      if (!avatar){
//          throw new ApiError(500, "Failed to upload avatar to cloudinary");
//      }

//      return res.status(200).json(new ApiResponse(200, avatar, "Avatar uploaded Successfully"));
// })

export { 
    registerUser, 
    verifyOTP, 
    resendOTP,
    loginUser,
    logoutUser
};