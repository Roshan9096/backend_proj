import e from "express";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from 'jsonwebtoken'


export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.
        replace("Bearer ", "");
    
        if (!token) {
            throw new ApiError(401,"Not authorized, no token provided");
        }
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(403,"Not authorized, token is invalid");
        }
        req.user = user
        next();
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid token")
    }
})