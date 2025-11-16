import mongoose, { Schema } from "mongoose";

const refreshTokenSchema = new Schema(
  {
    token : {
        type: String,
        required: true,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, 
    },
    userAgent: {
        type: String,
    
    },
    ip: {
        type: String,  
    },
    expiresAt: {
        type: Date,
    },
    replacedByToken: {
        type: String,
        default: null,
    },
  },
  {
    timestamps: true,
  }
);  

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);