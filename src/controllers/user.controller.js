import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from '../utils/ApiError.js'
import uploadOnCloudinary from '../utils/cloudinary.js'
import Apiresponse from "../utils/ApiResponse.js";
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
   console.log("email :",email)
  //check for validations
   if([
    fullName,email,username,password].some((field) => 
    field?.trim() === "")
   ){
    throw new ApiError(400,"All fields are required")
   }
})

const existedUser = User.findOne({
    $or : [{username},{email}]
})
if(existedUser){
    throw new ApiError(409,"User with email or username already exists")
}

const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if(!avatarLocalPath) {
    throw new ApiError(400,"Avatar file is req")
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
    throw new ApiError(500,"SomeThiing went wromng")
}

return res.status(201).json(
    new Apiresponse(200,createdUser,"User Registerd Succesfullly")
)


export default registerUser