// require(dotenv).config({path:'./env'})

import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    // Path:'./.env'
    path:'./.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`server is running at port ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("Error connecting to the database: ", error);
        throw error;
})



// import mongoose from "mongoose";

// import { DB_NAME } from "./constants";


// import express from "express";

// const app = express()

// ;(async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("errror",(error)=>{
//             console.log("Error: ",error);
//             throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on port${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.log("Error: ",error)
//         throw error
//     }
// })()