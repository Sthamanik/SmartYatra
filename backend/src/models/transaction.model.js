import mongoose,{Schema} from "mongoose";

const TransactionSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["pending", "completed", "failed"], 
        default: "pending" 
    },
    vehicle: {
        type: Schema.Types.ObjectId,
        ref: "Bus",
        default: null
    }
}, { timestamps: true });

export const Transaction = mongoose.model("Transaction", TransactionSchema);