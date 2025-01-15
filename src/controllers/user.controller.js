import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
// 

const genrateAccessAndRefreshtoken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = await User.genrateAccesstoken();
        const refreshToken = await User.genrateRefreshtoken();
        User.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});
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
    if(!username || !email){
        throw new ApiError(400,'Username or email is required')
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });
    if(!user){
        throw new ApiError(401,'Invalid credentials')
    }
    const passwordvalid = user.isPassworsdCorrect(password);
    if(!passwordvalid){
        throw new ApiError(401,'user does not exits with password')
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
    return res.status(200).clearCookie("accessToken", accessToken,options)
    .clearCookie("refreshToken", refreshToken,options).json(200,{},"user logged out")
})
export {
    registerUser,
    loginUser,
    logoutUser
};

