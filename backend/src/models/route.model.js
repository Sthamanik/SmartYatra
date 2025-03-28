import mongoose, {Schema} from "mongoose";

const RouteSchema = new Schema ({
    route_name: {
        type: String,
        required: true,
    },
    stops: [{
        name: { type: String, required: true },
        location: { type: { 
            type: String, 
            enum: ['Point'], 
            required: true 
        }, 
        coordinates: { type: [Number], required: true } }, 
        distance: { type: Number, required: true },
        travelTime: { type: Number, required: true },
        order: { type: Number, required: true }
    }]    
})

RouteSchema.index({ route_name: 1 });

export const Route = mongoose.model('Route', RouteSchema);