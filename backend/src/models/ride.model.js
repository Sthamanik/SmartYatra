import mongoose,{Schema} from "mongoose";

const RideSchema = new Schema({
    passenger: { 
        type: Schema.Types.ObjectId, 
        ref: "User", required: true 
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
        required: true 
    },
    paymentMethod: { 
        type: String, 
        enum: ["wallet", "cash"], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["ongoing", "completed", "canceled"], 
        default: "ongoing" 
    },

    estimatedTime: { type: Number } 
}, { timestamps: true });

export const Ride = mongoose.model("Ride", RideSchema)