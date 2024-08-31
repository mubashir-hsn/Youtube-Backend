import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import {User} from "../models/user.modeld.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/response.js";
import {jwt} from "jsonwebtoken";
import mongoose from "mongoose";


const genarateAccessAndRefreshToken = async(userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.refreshAccessToken()
     
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})

    return{accessToken,refreshToken}

  } catch (error) {
     throw new apiError(500,"Something went wrong while generating access and refresh token")
  }
} 

const registerUser = asyncHandler(async (req,res)=>{
    // res.status(200).json({
    //     message:'Ok',
    // })

  /*........... Steps to register User ...................

    --> Get user detail from frontend
    --> Validation - Not empty
    --> check if user already exit - username,email
    --> check for image & avatar
    --> upload them to cloudinary , avatar
    --> create user object - create entry in db
    --> remove password and refresh token from respond
    --> check for user creation
    --> return res

    */
   const {username , fullName , email , password} = req.body;

   if(
    [username , fullName , email , password].some((field)=>field?.trim()==="")
   ){
    throw new apiError(400 , "All fields are required.")
   }

   const existedUser = await User.findOne({
    $or:[{username},{email}]
   })
   
   if(existedUser){
    throw new apiError(409 , "Username or email already existed.")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path ;
  //  const coverImageLocalPath = req.files?.coverImage[0]?.path ;

   let coverImageLocalPath;

   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
   }

   if(!avatarLocalPath){
    throw new apiError(400 , "Avatar file is required.")
   }
   
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
    throw new apiError(400 , "Avatar file is required.")
   }

  const user = await User.create({
    fullName,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    password
   })

   const createdUser = await User.findById(user._id).select(" -password -refreshToken ")

   if(!createdUser){
    throw new apiError(500,"Something went wrong while registering the user.")
   }

   return res.status(201).json(
    new apiResponse(200,createdUser,"User registered successfully.")
   )

})


const loginUser = asyncHandler( async (req,res)=>{
   
   // req  body --> data
   // username , email
   // find user 
   // password check
   //access or refresh token
   // send cookies

   const {email , username , password} = req.body

   if (!email && !username) {
       throw new apiError(400,"username or email required.")
   }

   const user = await User.findOne({
    $or : [{username} , {email}]
   })

   if (!user) {
    throw new apiError(404,"username doesn't exist.")
   }

   const isPasswordValid =  await user.isPassCorrect(password)

   if (!isPasswordValid) {
     throw new apiError(401,"Password incorrect")
   }

   const {accessToken , refreshToken} = await genarateAccessAndRefreshToken(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

      const options = {
        httpOnly : true,
        secure : true
      }

    return res
    .status(200)
    .cookie("accessToken" , accessToken ,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new apiResponse(
        200,
        {
          user:  loggedInUser , accessToken, refreshToken
        },
        "User logged In Successfully."
      )
    )
})

const logOutUser = asyncHandler(async(req,res)=>{

   await  User.findByIdAndUpdate(
    req.user._id,
    {
      $unset : {
        refreshToken : 1,
      }
    },
    {
      new : true
    }
   )

   const options = {
    httpOnly : true,
    secure : true
  }

  return res
         .status(200)
         .clearCookie("accessToken",options)
         .clearCookie("refreshToken",options)
         .json(new apiResponse(200,{},"User logged out."))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incompingRefreshTOKEN = req.cookies.refreshToken || req.body.refreshToken

    if (!incompingRefreshTOKEN) {
      throw new apiError(401,"Unauthorized request")
    }

    try {
      const decodedTOKEN = jwt.verify(incompingRefreshTOKEN, process.env.REFRESH_TOKEN_SECRET)
      
      const user = await User.findById(decodedTOKEN?._id)
      if (!user) {
        throw new apiError(401,"Invalid refresh token")
      }
      
      if (incompingRefreshTOKEN !== user?.refreshToken) {
        throw new apiError(401,"Refresh token used or expired")
      }
  
      const options = {
        httpOnly : true,
        secure : true
      }
  
      const {accessToken,newRefreshToken} = await genarateAccessAndRefreshToken(user._id)
  
      return res
             .status(200)
             .cookie("accessToken",accessToken,options)
             .cookie("refreshToken",newRefreshToken,options)
             .json(
              new apiResponse(
                200,
                {accessToken, refreshToken : new newRefreshToken},
                "Access token refreshed"
              )
             )
    } catch (error) {
      throw new apiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{

  const {oldPassword , newPassword} = req.body
  const user = await User.findById(user?._id)

  const isPassCorrect = await user.isPassCorrect(oldPassword)
  if (!isPassCorrect) {
    throw new apiError(401,"Invalid old password")
  }
 
  user.password = newPassword
  await user.save({validateBeforeSave:false})

  return res
            .status(200)
            .json(new apiResponse(200,{},"Password changed successfully"))

})

const currentUser = asyncHandler(async(req,res)=>{
  return res.status(200)
            .json(new apiResponse(200, req.user , "User fetched successfully"))
})

const changeAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName,email} = req.body
  if (!fullName || !email) {
    throw new apiError(401,"All fields are required")
  }
 
  const user = await User.findByIdAndUpdate(
    req.user?._id,
   {
    $set:{
      fullName,
      email
    }
   } ,
   {
    new : true
   } 
  ).select("-password")
    
  return res.status(200)
            .json(new apiResponse(200,user,"Account details are updated successfully"))
})

const changeAvatar = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath) {
    throw new apiError(401,"Avatar file is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar.url) {
    throw new apiError(500,"Error while uploading avatar")
  }
  const user =  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
            avatar : avatar.url
           }
    },
    {new:true}
   ).select("-password")
   return res.status(200)
            .json(new apiResponse(200,user,"Avatar is updated successfully"))
})

const changeCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path
  if (!coverImageLocalPath) {
    throw new apiError(401,"Cover Image file is missing")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!coverImage.url) {
    throw new apiError(500,"Error while uploading cover image")
  }
   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
            coverImage : coverImage.url
           }
    },
    {new:true}
   )
   return res.status(200)
            .json(new apiResponse(200,user,"Cover image is updated successfully")) 
})


const getUserChannel = asyncHandler(async(req,res)=>{
  const {username} = req.params
  if (!username?.trim()){
    throw new apiError(400,"username is missing")
  }
  
  const channel = await User.aggregate([
    {
    $match:{
      username : username?.toLowerCase()
    }
  },
  {
   $lookup: {
    from : "subscriptions",
    localField : "_id",
    foreignField : "channel",
    as : "subscribers"
   }
  },
  {
     $lookup: {
      from : "subscriptions",
      localField : "_id",
      foreignField : "subscriber",
      as : "subscribedTo"
     }
  },
  {
    $addFields : {
      subscribersCount : {
        $size : "$subscribers"
      },
      channelsSubscribedToCount : {
        $size : "$subscribedTo"
      },
      isSubscribed : {
        if : {$in : [req.user?._id , "$subscribers.subscribers"]},
        then: true,
        else: false
      }
    }
  },
  {
    $project : {
      fullName :1,
      username:1,
      email:1,
      avatar:1,
      coverImage:1,
      subscribersCount:1,
      channelsSubscribedToCount:1,
      isSubscribed:1,
    }
  }
])

  if (!channel?.length) {
    throw new apiError(400 , "Channel doesn't not exist")
  }

  return res
          .status(200)
          .json(
            new apiResponse(200,channel[0],"Channel fetched successfully")
          )

})

const getWatchHistory = asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match : {
        _id : new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup : {
        from : "videos",
        localField : "watchHistory",
        foreignField : "_id",
        as : "watchHistory",
        pipeline : [
          {
            $lookup :{
              from : "users",
              localField : "owner",
              foreignField : "_id",
              as : "owner",
              pipeline : [
                {
                  $project : {
                    fullName :1,
                    username : 1,
                    avatar : 1,
                  }
                }
              ]
            }
          },
          {
           $addFields : {
            owner : {
              $first : "$owner"
            }
           }
          }
        ]
      }
    }
  ])

   return res
          .status(200)
          .json(
            new apiResponse(
              200,
              user[0].watchHistory,
              "Watch history fetched successfully"
            ))
})

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  currentUser,
  changeAccountDetails,
  changeAvatar,
  changeCoverImage,
  getUserChannel,
  getWatchHistory,
}