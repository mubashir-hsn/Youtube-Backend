import {Router} from "express";
import { 
    changeAccountDetails,
    changeAvatar,
    changeCoverImage,
    changeCurrentPassword, 
    currentUser, 
    getUserChannel, 
    getWatchHistory, 
    logOutUser, 
    loginUser, 
    refreshAccessToken, 
    registerUser 
} from "../controller/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser)
// secured routes ...........
router.route("/logout").post(verifyJwt,logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJwt,changeCurrentPassword)
router.route("/current-user").get(verifyJwt,currentUser)
router.route("/update-account").patch(verifyJwt,changeAccountDetails)
router.route("/avatar").patch(verifyJwt,upload.single("avatar"),changeAvatar)
router.route("/cover-image").patch(verifyJwt,upload.single("coverImage"),changeCoverImage)
router.route("/c/:usrename").get(verifyJwt,getUserChannel)
router.route("/history").get(verifyJwt,getWatchHistory)


export default router;