import mongoose, { model } from "mongoose";

const tweetSchema  = new mongoose.Schema({
    content : {
        type : String,
        required : true
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "user"
    }
},{timestamps : true})

export const Tweet = model("Tweet",tweetSchema)