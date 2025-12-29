import logger from "../config/logger.js";
import mongoose from "mongoose";

const connectDB=async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI);
       logger.info("MongoDB connected");
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }
}

export default connectDB;