import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const uploadOnCloudinary = async(localFilePath)=>{
        try{

            if(!localFilePath) return 'Path not found'
            const uploadResult = await cloudinary.uploader.upload(localFilePath,
        {
        public_id: "shoes",
        resource_type:'auto'
    }).catch((error)=>{console.log(error)});
       console.log('File uploaded successfully on cloudinary: ',uploadResult.url);
       return uploadResult
        }
        catch(error){
            fs.unlinkSync(localFilePath) // remove locally saved temporary file as upload option failed.
            return null
        }
    }

    export {uploadOnCloudinary}
    
    // Upload an image
    // const uploadResult = cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg", {
    //     public_id: "shoes"
    // }).catch((error)=>{console.log(error)});
    
    // console.log(uploadResult);