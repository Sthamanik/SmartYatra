import mongoose,{Schema} from "mongoose";

const DriverSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    licenseNumber: {
        type: String,
        required: true,
        unique: true
    },
    experience: {
        type: Number,
        required: true,
        min: 0
    },
    assignedBus: {
        type: Schema.Types.ObjectId,
        ref: "Bus",
        default: null
    },
    ratings: [{
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        score: { type: Number, min: 0, max: 5 }
    }],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    status: {
        type: String,
        enum: ["available", "inactive", "on-duty"],
        default: "available"
    }
}, { timestamps: true });

export const Driver = mongoose.model("Driver", DriverSchema);