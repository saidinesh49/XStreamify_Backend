import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB= async()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`MONGO_DB connected || and listening on ${connectionInstance.connection.host}`)
    }catch(error){
        console.log("MONGO_DB Connection Failed :",error);
        process.exit(1);
    }
}

export default connectDB;