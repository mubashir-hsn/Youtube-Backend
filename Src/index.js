// require('dotenv').config({path : "./env"})
import connectDB from "./db/index.js"
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config(
    {
        path : "./env"
    }
)


connectDB()
.then(()=>{

     app.on('error',(error)=>{
    console.log('err:',error)
    throw error
     })

    app.listen(process.env.PORT || 3000 , ()=>{
    console.log(`App is listening on port ${process.env.PORT}`)   
    })
})
.catch((error)=>{
    console.log("MoongoDb connection failed: ",error)
})
