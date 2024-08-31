import dotenv from 'dotenv';
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
     app.listen(process.env.PORT || 8000,()=>{
        console.log('Server is listening on port: ',process.env.PORT);
     });
     app.on('Error',(error)=>{
        console.log('Express server error: ',error);
        throw error;
     })
})
.catch((error)=>{
    console.log('MONGO_DB connection failed',error);
});






 


// import mongoose from 'mongoose';
// import { DB_NAME } from './constants';

// import express from 'express';
// const app=express();

// (async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGOURI}/${DB_NAME}`)
//         app.on('Error',(error)=>{
//             console.log('Error failed to connect by express')
//             throw error;
//         })

//         app.listen(`${process.env.PORT}`,()=>{
//             console.log('Mongoose is connected and Listening on Port:',process.env.PORT);
//         })
//     } catch(error){
//         console.log('Error :',error);
//         throw error;
//     }
// })()