import mongoose,{Schema} from "mongoose";

const DriverSchema = new Schema({
    id: {
        type: Schema.Types.ObjectId,
        ref: "user",
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
    assigned_bus: {
        type: Schema.Types.ObjectId,
        ref: "Bus",
        default: null
    },
    rating: {
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
}, {timestamps: true})

export const Driver = mongoose.model("Driver", DriverSchema);