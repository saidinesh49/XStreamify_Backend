import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema({

    content:{
        type: String,
        required: true
    },

    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    likes: {
        type: Number,
        default: 0,
      },
      retweets: {
        type: Number,
        default: 0,
      },
      replies: {
        type: Number,
        default: 0,
      },

},{timestamps: true});


export const Tweet = mongoose.model("Tweet",tweetSchema);