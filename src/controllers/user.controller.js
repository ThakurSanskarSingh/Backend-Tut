import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from '../utils/ApiError.js'
import uploadOnCloudinary from '../utils/cloudinary.js'
import Apiresponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose, { mongo } from "mongoose";
const generateAccessAndRefreshTokens = async(userId) => {
   
         const user =   await User.findById(userId)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()

        //save refresh token to databse 
        user.refreshToken = refreshToken
        await user.save({vaildateBeforeSave : false})

        return {accessToken,refreshToken}

    
}




const registerUser = asyncHandler( async (req,res) => {
   //get users details from frontend
      //check for validations
   //check if user already exist
   //check for images and avatr;
   //upload them to cloudn=inary
   //create user object - entry in db
   //remove password nad refresh token fom response
   //check for user crearion
   //reurn res

   //get users details from frontend
   const {fullName,email,username ,password} = req.body
//    console.log("body :",req.body)
   
  //check for validations
   if([
    fullName,email,username,password].some((field) => 
    field?.trim() === "")
   ){
    throw new ApiError(400,"All fields are required")
   }


   const existedUser = await User.findOne({
    $or: [{ username }, { email }]
})


if(existedUser){
    throw new ApiError(409,"User with email or username already exists")
}

const avatarLocalPath = req.files?.avatar[0]?.path;
// const coverImageLocalPath = req.files?.coverImage[0]?.path;

let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
}

if(!avatarLocalPath) {
    throw new ApiError(400,"Avatar local file is req")
}

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)


if(!avatar) {
    throw new ApiError(400,"Avatar file is req")
}

const user = await User.create({
    fullName,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    email,
    password,
    username : username.toLowerCase()
})

const createdUser = await User.findById(user._id).select(
    "-password -refreshToKen"
)

if(!createdUser){
    throw new ApiError(500,"user creation failed")
}

return res.status(201).json(
    new Apiresponse(200, createdUser, "User registered Successfully")
)
})

//login user

const loginUser = asyncHandler(async (req,res) => {
// req body -- data
//usrname or email
//check user
//password check
//access and refresh tokens
// send cookie


const {email,username,password} = req.body
if(!username && !email ){
    throw new ApiError (400,"email or username required")
}

const user = await User.findOne({
    $or : [{email},{username}]
})
if(!user) {
    throw new ApiError (404,"user not found")
}

 const isPasswordValid =  await user.isPasswordCorrect(password)
 if(!isPasswordValid) {
    throw new ApiError (404,"password incorrect")
}

const {accessToken,refreshToken} = await
 generateAccessAndRefreshTokens(user._id)


 //remove password and refrestoken from loggedinuser

 const loggedInUser = await User.findById(user._id)
 .select("-password -refreshToken")

// send cookies
//need to stiudy
const options = {
    httpOnly : true,
    secure : true
}

return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new Apiresponse (200,{
        user : loggedInUser , accessToken ,refreshToken
    },
    "User Logged in succesfully"
    )
)

})

const logoutUser = asyncHandler(async (req,res) => {
    //remove cookies and refrsh tokens
    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set : {
                refreshToken : undefined
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

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new Apiresponse(200,{},"User Logged Out succesfully"))
})

//refresh the actcess token by hitting a endpoint so that user has not to give email,passsword agin again

const refreshAccessToken = asyncHandler(async(req,res) => {
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
   if(!incomingRefreshToken) {
    throw new ApiError(401,"unathorized request")
       }
    const decodedToken =    jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken._id)
    if(!user) {
        throw new ApiError(401,"Invalid Refresh Token")
    }
    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Refresh Token is expired")
    }
    const options = {
        httpOnly : true,
        secure : true
    }
   const {accessToken,newRefreshToken} =  await generateAccessAndRefreshTokens(user._id)
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",newRefreshToken,options)
   .json(
    new Apiresponse (200,{
        accessToken , refreshToken : newRefreshToken
    },"Access token refreshed")
   )
   //change password 
   //take old and new pasword input from user
   //find user by id
   //check password by isPasswordCorreect method

   
   
})

const changePassword = asyncHandler(async(req,res) => {
 const {oldPassword,newPassword} = req.body

 const user = await User.findById(req.user?._id)
 const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

 if(!isPasswordCorrect){
     throw new ApiError(400,"Invalid old Password")
 }
 user.password = newPassword
 await user.save({vaildateBeforeSave : false})
 return res.status(200)
 .json(new Apiresponse(200,"Password chnaged succesfully"))
})

const getCurrentUser = asyncHandler(async(req,res) => {
    return res.status(200)
    .json(200,req.user,"Current user fetched succesfuly")
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName,email} = req.body
    if(!fullName || !email){
        throw new ApiError(201,"Fullname and email is required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {$set : {
            fullName,email
        }},
        {new : true}
        ).select("-password")

        return res.status(200)
        .json(new Apiresponse(200),user,"Account details updated succesfully")
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(201,"Avatar file is requred")

           }
           const avatar = await uploadOnCloudinary(avatarLocalPath)
           if(!avatar.url){
            throw new ApiError(201,"error while uploading avatar on coudinary")
           }

           const user = await User.findByIdAndUpdate(req.user?._id,
            {$set : {
                avatar : avatar.url
            }},
            {new : true
            }).select("-password")

            return res.status(200)
            .json(new Apiresponse(201,user,"Avatar updated succesfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
const coverImageLocalPath = req.file?.path

if(!coverImageLocalPath) {
    throw new ApiError(400,"cover image file is requred")
}
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!coverImage.url){
    throw new ApiError(201,"error while uploading cover image on coudinary")
}
const user = await User.findByIdAndUpdate(req.user?._id,
    {$set : {
        coverImage : coverImage.url
    }},
    {new : true
    }).select("-password")

    return res.status(200)
    .json(new Apiresponse(201,user,"Cover image updated succesfully"))
})

const getUserProfile = asyncHandler(async(req,res) => {
const {username} = req.params

if(!username?.trim()) {
    throw new ApiError(400,"username is missing")
}

const channel = await User.aggregate([
    {
        $match : {
            username : username?.toLowerCase()
        }
    },
    { //to find no. of subscribers check for channels
        $lookup : {
            from : "subscriptions",
            localField : "_id",
            foreignField : "channel",
            as : "subscibers"
        }
    },
    { //to find no. of channel subscribed check for subscriber
        $lookup : {
            from: "subscriptions",
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
                $cond : {
                    
                if: {$in : [req.user?._id,"$subscribers.subscriber"]},
                then : true,
                else : false
                }
            }
        }
    }, 
    {
        //project is used to give restrictred value
        $project : {
            fullName : 1,
            username : 1,
            subscribersCount : 1,
            channelsSubscribedToCount : 1,
            isSubscribed : 1,
            avatar : 1,
            coverImage : 1,
            email : 1
        }
    }

])
    if(!channel?.length) {
        throw new ApiError(404,"channel does not exist")
    }

    return res.status(200)
    .json(new Apiresponse(200,channel[0],"user channel fetched succesfully"))
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id :  new mongoose.Types.ObjectId(req.user._id)
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
                        $lookup : {
                            from : "user",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },{
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

    return res.status(200)
    .json(
        new Apiresponse(200,user[0].watchHistory,"watch history fetched successfully")
    )
})

export { loginUser ,getUserProfile, registerUser ,updateUserCoverImage, logoutUser,refreshAccessToken, getWatchHistory,updateAccountDetails,updateUserAvatar, changePassword,getCurrentUser}