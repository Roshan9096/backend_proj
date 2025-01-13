import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localpath) => {
    try {
        if(!localpath)return null;

        //upload on cloudinary
        const responce =await cloudinary.uploader.upload(
            localpath, {
                resource_type: "auto",
            },
        )

        //file successfully uploaded
        console.log("file successfully uploaded",responce.url);
        return responce.url;
    } catch (error) {
        fs.unlinkSync(localpath)//remove the locally saved temporary file
    }
}

// cloudinary.uploader.upload(
//     'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//         public_id: 'shoes',
//     },
//     function(error, result){console.log(result)}
//     );
