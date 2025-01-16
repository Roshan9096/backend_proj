import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
// 

const genrateAccessAndRefreshtoken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken =  user.generateAccessToken();
        const refreshToken =  user.generateRefreshToken();
        user.refreshToken = refreshToken;

        await user.save({validateBeforeSave: false });
        return {accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(400,"something went wrong while generating access&referesh token")
    }
}

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
    const { username, email, fullname, password} = req.body;
    console.log(username,email,fullname,password);
    if(!username || !email || !fullname || !password){
        throw new ApiError(400,'All fields are required')
    }
    const exitedUser = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )
    if(exitedUser){
        throw new ApiError(409,'User already exists')
    }

    console.log(req.files)
    const avatarlocalPath = req.files?.avatar?.[0]?.path;
    const coverImagelocalPath = req.files?.coverImage?.[0]?.path;
    console.log(avatarlocalPath);

    if (!avatarlocalPath) {
        
        throw new ApiError(400,"Avatar file required");
        
    }

    const avatar = await uploadOnCloudinary(avatarlocalPath);
    const coverImage = await uploadOnCloudinary(coverImagelocalPath);
    console.log(avatar.url);
    if (!avatar) {
        throw new ApiError(500,"Error uploading avatar");
    }

    const user = await User.create(
        {
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url||'',
            email,
            password,
            username:username.toLowerCase(),
        }
    );
    const usercreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!usercreated) {
        throw new ApiError(500);   
    }

    return res.status(200).json(
        new ApiResponse(200,usercreated,"created user successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    //req body ->data
    //username, email
    //find user
    //password check
    //access and refresh token
    //send cookies

    const {username, email, password} = req.body;
    console.log(username, email);
    console.log(password);

    if(!(username || email)){
        throw new ApiError(400,'Username or email is required')
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });
    if(!user){
        throw new ApiError(401,'Invalid credentials')
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials--------------")
    }

    const {accessToken, refreshToken} = await genrateAccessAndRefreshtoken(user._id);
    const logedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200).cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: logedInUser,accessToken,refreshToken
            }
            ,
            "Logged in successfully"
        )
    );
})

const logoutUser = asyncHandler(async(req, res, next)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200).
    clearCookie("accessToken",options)
    .clearCookie("refreshToken",options).json(200,{},"user logged out")
})

const refreshAccessToken = asyncHandler(async(req, res, next)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "No refresh token provided || unauthorized access");
    }

    try {
        const decodedToken =jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invilade refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or used");
        }
    
        const {accessToken, newrefreshToken}=await genrateAccessAndRefreshtoken(user._id)
    
        const options = {
            httpOnly: true,
            secure: true,
        }
    
        // return res.status(200).cookie("accessToken", user.generateAccessToken(), options)
        // .cookie("refreshToken", user.generateRefreshToken(), options)
    
    
        return res.status(200).cookie("accessToken", accessToken, options)
        .cookie("newrefreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "refreshed access token"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.massage||"Invalid refresh token user.controller.js/refreshAccessToken")
    }
    
})

const changCurrentPassword = asyncHandler(async (req, res, next)=>{
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id)
    const isPasswordcorrect = await User.isPasswordCorrect(oldPassword);
    if(!isPasswordcorrect){
        throw new ApiError(401,"Invalid old password")
    }
    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res.status(200).json(
        new ApiResponse(200,{},"Password changed successfully")
    )
})

const getcurrentUser = asyncHandler(async (req, res, next)=>{
    return res.status(200).json(
        200,res.user,"Current user fatched successfully "
    )
});

const updateUserDetails = asyncHandler(async (req, res, next)=>{
    const {fullname, email} = req.body;

    if(!fullname||!email){
        throw new ApiError(400,"Fullname and email are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullname:fullname,
                email:email
                }
        },
        {new:true}
    )
    return res.status(200).json(
        new ApiResponse(200,user,"User details updated successfully")
    )
});

const updateuserAvatar = asyncHandler(async (req,res)=>{
    const avatarlocalPath = req.file?.path
    if (!avatarlocalPath) {
        throw new ApiError(400,"Avatar file required");
    }

    //uploadAvatar on cloudinary
    const avatar = await uploadOnCloudinary(avatarlocalPath);

    if (!avatar.url) {
        throw new ApiError(500,"Error uploading avatar");
    }

    //update user avatar in db
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")
    return res.status(200).json(
        new ApiResponse(200,user,"User avatar updated successfully")
    )
})

const updateusercoverImage = asyncHandler(async (req,res)=>{
    const coverImagelocalPath = req.file?.path
    if (!coverImagelocalPath) {
        throw new ApiError(400,"cover Image file required");
    }

    //upload coverImage on cloudinary
    const coverImage = await uploadOnCloudinary(coverImagelocalPath);

    if (!coverImage.url) {
        throw new ApiError(500,"Error uploading coverImage");
    }

    //update user avatar in db
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar: coverImage.url
            }
        },
        {new:true}
    ).select("-password")
    return res.status(200).json(
        new ApiResponse(200,user,"User coverImage updated successfully")
    )
})

export {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changCurrentPassword,
    getcurrentUser,
    updateuserAvatar,
    updateusercoverImage
};

