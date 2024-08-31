import mongoose,{ Schema } from 'mongoose';

const userSchema= new Schema({
   username:{
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index:true,
   },
   email:{
    type: String,
    required: true,
    unique:true,
    lowercase:true,
   },
   fullName:{
    type: true,
    required: true,
    index:true,
   },
   avatar:{
    type: String,
    required: true,
   },
   coverImage:{
    type: String,
   },

   watchHistory:[
    {
        type: Schema.Types.ObjectId,
        ref: 'Video',
    }
   ],

   password:{},
   refreshToken:{},

},{timestamp:true});


export const User=mongoose.model('User',userSchema);