import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARTY_API_KEY,
  api_secret: process.env.CLOUDINARTY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(
            localFilePath,{
                resource_type : "auto"
            }
        )
        console.log("File has been uoloaded  ",response.url)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        //remove the locally stored files
    }
}