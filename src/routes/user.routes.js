import { Router } from "express";
import {
    changCurrentPassword,
    getcurrentUser,
    getuserChannelProfile,
    getUserwatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateuserAvatar,
    updateusercoverImage,
    updateUserDetails
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"; //
; //
const router = Router()
// src\middlewares\multer.middleware.js
router.route("/register").post(
    // middleware for validation
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
    
)

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changCurrentPassword)

router.route("/me").get(verifyJWT, getcurrentUser);

router.route("/update-account").post(verifyJWT, updateUserDetails); 

router.route("/upload-avatar").post(verifyJWT, upload.single("avatar"), updateuserAvatar);

router.route("/upload-cover-image").post(verifyJWT, upload.single("coverImage"), updateusercoverImage);

router.route("/c/:username").get( verifyJWT, getuserChannelProfile);

router.route("/watch-history").get(verifyJWT, getUserwatchHistory);
export default router