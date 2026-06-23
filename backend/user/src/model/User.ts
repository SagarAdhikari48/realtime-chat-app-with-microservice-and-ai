import mongoose, { Document, Schema } from "mongoose";

// here Document and Schama are named imports
// The curly braces {} are used for named exports.
// Document is a TypeScript type/interface representing a MongoDB document.

export interface IUser extends Document {
  name: string;
  email: string;
}

const schema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true, // created_at and updated_at
  },
);

export const User = mongoose.model<IUser>("User", schema);

//OTP will send to verify we will use redis for OTP but we use upstash 
// for redis because upstash gives 256 mb storage but redis official website gives us only 30 mb storage only
