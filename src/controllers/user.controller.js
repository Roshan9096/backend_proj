import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from'../utils/apiError.js';
import { User } from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/uploadOnCloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
const registerUser = asyncHandler(async (req, res)=>{
    //get user details from frontend
    // validation -not empty
    //check if user already exists: username, emmail
    //check for images, check for avatar
    //upload them to cloudinary,avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response
    const { username, email } = req.body;
    console.log(username)
    if(username==="" ||email===""||fullname==="" || password===""){
        throw new ApiError(400,'All fields are required')
    }
    const exitedUser = User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )
    if(exitedUser){
        throw new ApiError(409,'User already exists')
    }

    const avatarlocalpath = req.files?.avatar[0]?.path;
    const coverimagelocalpath = req.files?.coverimagelocal[0]?.path;

    if (!avatarlocalpath) {
        throw new ApiError(400,"Avatar file required");
        
    }

    const avatar = await uploadOnCloudinary(avatarlocalpath);
    const coverimage = await uploadOnCloudinary(coverimagelocalpath);

    if (!avatar) {
        throw new ApiError(500,"Error uploading avatar");
    }

    const user = await User.create(
        {
            fullname,
            avatar: avatar.url,
            coverimage: coverimage?.url||"",
             email,
            password,
            username:usename.toLowerCase(),
        }
    )
    const usercreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!usercreated) {
        throw new ApiError(500);   
    }

    return res.status(200).json(
        new ApiResponse(200,usercreated,"created user successfully")
    )
})

export {
    registerUser
}

