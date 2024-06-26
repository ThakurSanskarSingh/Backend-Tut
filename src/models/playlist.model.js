import mongoose, { Schema } from "mongoose";

const playlistSchema = new mongoose.Schema({
    name : {
        type : string ,
        required : true
    },
    description : {
        type : string ,
        required : true
    },
    videos : [{
        type : Schema.Types.ObjectId,
        ref : "video"
    }],
    owner : {
        type : Schema.Types.ObjectId,
        ref : "user"
    }
},{timestamps : true})

export const Playlist  = mongoose.model("Playlist",playlistSchema)