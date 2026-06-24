import mongoose, { Mongoose } from "mongoose";

const connectDb = async () => {
  const url = process.env.MONGO_URI;

  if (!url) {
    throw new Error("MONGO_URI is not defined in the environment variables");
  }

  try {
    await mongoose.connect(url, {
      dbName: "Chatappmicroserviceapp",
    });
    console.log("Connected to Mongodb Database!");
  } catch (error) {
    console.log("Failed to connect Mongodb", error);
    process.exit(1);
  }
};

export default connectDb;
