
import mongoose from "mongoose";

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error("MONGODB_URI is not defined in .env");
  }

  const connection = await mongoose.connect(mongoURI);

  console.log(
    `MongoDB connected`
  );
};

export default connectDB;
