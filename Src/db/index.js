import mongoose from "mongoose";
import {DB_NAME} from "../constaints.js";

const connectDB = async()=>{
  try {
    const conectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`\n MongoDB connected !! DB host : ${conectionInstance.connection.host}`)
  } catch (error) {
    console.log('MongoDB conection error ',error)
    process.exit(1);
  }
}

export default connectDB