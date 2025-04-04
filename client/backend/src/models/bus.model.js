import mongoose, {Schema} from "mongoose";

const BusSchema = new Schema({
    busNumber : {
        type: String,
        required: true,
        unique: true
    },
    route:{
        type: Schema.Types.ObjectId,
        ref: "Route",
        required: true
    },
    assignedDriver: {
        type: Schema.Types.ObjectId,
        ref: "Driver",
        default: null
    },
    capacity: {
        type: Number,
        default: 30
    },
    available_capacity:{
        type: Number,
        default: 30,
        min: 0,
        max: 30
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    current_location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    estimatedArrivals: [{
        stopId: { type: Schema.Types.ObjectId, ref: "Route" },
        eta: { type: Date } 
    }],
    currentStopOrder: { type: Number, default: 1 }
}, {timestamps: true})

export const Bus = mongoose.model('Bus', BusSchema);