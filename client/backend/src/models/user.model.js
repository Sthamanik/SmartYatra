import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const UserSchema = new Schema({
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
    password: {
        type: String,
        required: true,
        match: [
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
            "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character"
        ]
    },
    phone: {
        type: String,
        required: true,
        index: true,
        unique: true,
        match: [/^(?:\+977)?(98\d{8}|97\d{8}|01\d{7})$/, "Invalid phone number"]
    },
    DOB: {
        type: Date,
        required: true
    },
    avatar: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: ["passenger", "driver", "admin"],
        default: "passenger"
    },
    walletBalance: {
        type: Number,
        default: 0,
        min: 0,
        max: 10000
    },
    currentLocation: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: {
            type: [Number],
            default: [0, 0],
            validate: {
                validator: function (coords) {
                    return coords.length === 2 && coords.every(n => !isNaN(n));
                },
                message: "Invalid location coordinates"
            }
        }
    },
    refreshToken: {
        type: String,
        default: null
    },
    otp: {
        code: { type: String, match: [/^\d{6}$/, "OTP must be a 6-digit number"], default: null },
        expiredAt: { type: Date, default: null },
        verified: { type: Boolean, default: false }
    },
    otpAttempts: { type: Number, default: 0, min: 0, max: 5 }, // Failed OTP attempts for verification
    otpResendAttempts: { type: Number, default: 0, min:0, max:3 }, // Number of times OTP was resent
    isVerified: { type: Boolean, default: false }, // Marks user as verified
    deleteConfirmation: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

UserSchema.index({ currentLocation: "2dsphere" });

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { 
            _id: this._id,
            email: this.email,
            phone: this.phone,
            fullname: this.fullname
        }, 
        process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

UserSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id }, 
        process.env.REFRESH_TOKEN_SECRET, 
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

// Auto-delete unverified users exceeding retry limit
UserSchema.statics.cleanupUnverifiedUsers = async function () {
    await this.deleteMany({ isVerified: false, otpAttempts: { $gte: 5 } });
    await this.deleteMany({ isVerified: false, otpResendAttempts: { $gte: 4 } });
};

UserSchema.statics.cleanUpDeleteConfirmatinUsers = async function() {
    await this.deleteMany({ deleteConfirmation: true });
}

export const User = mongoose.model("User", UserSchema);
