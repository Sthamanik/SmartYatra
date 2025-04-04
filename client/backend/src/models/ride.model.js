import mongoose, { Schema } from "mongoose";

const RideSchema = new Schema({
    passenger: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    bus: { 
        type: Schema.Types.ObjectId, 
        ref: "Bus", 
        required: true 
    },
    startStop: { 
        type: String, 
        required: true 
    },
    endStop: { 
        type: String, 
        required: true 
    },
    fare: { 
        type: Number,
        default: null 
    },
    paymentMethod: { 
        type: String, 
        enum: ["wallet", "cash"], 
        default: null
    },
    status: { 
        type: String, 
        enum: ["ongoing", "completed", "canceled"], 
        default: "ongoing" 
    },
    verified: {
        type: Boolean,
        default: false
    },
    estimatedTime: { 
        type: Number 
    }
}, { timestamps: true });

RideSchema.statics.cleanupExpiredRides = async function () {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = await this.deleteMany({ createdAt: { $lt: fiveMinutesAgo }, verified: false });
    console.log(`${result.deletedCount} expired unverified rides deleted.`);
};

export const Ride = mongoose.model("Ride", RideSchema);