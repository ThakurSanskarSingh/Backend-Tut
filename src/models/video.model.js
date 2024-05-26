import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoShchema = Schema({
    videoFile : {
        type : String, //cloudnary url
        req : [true,"Video is required"]
    },
    thumbnail : {
        type : String, //cloudnary url
        req : [true,"Thumbnail is required"]
    },
    title : {
        type : String, 
        req : [true,"Title is required"]
    },
    description  : {
        type : String, 
        req : [true,"Description is required"]
    },
    duration  : {
        type : Number, 
        req : [true,"Description is required"]
    },
    views  : {
        type : Number, 
       default : 0
    },
    isPublished  : {
        type : Boolean, 
       default : true
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }

},{timestamps : true})

videoShchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.Model("Video",videoShchema)