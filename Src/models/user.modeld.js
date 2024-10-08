import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrypt";
import  Jwt  from "jsonwebtoken";

const userSchema = new Schema(
{
    username:{
        type: String,
        require:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type: String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type: String,
        required:true,
        trim:true,
        index:true
    },
    watchHistory:[
        {
         type: Schema.Types.ObjectId,
         ref:"Video"
        }
    ],
    avatar:{
        type: String, // cloudinary url
        required:true,
    },
    coverImage:{
        type: String, // cloudinary url
    },
    password:{
        type:  String ,
        required:[true,'Password is required']
    },
    refreshToken:{
        type: String,
    }
},
{
    timestamps:true
})

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPassCorrect = async function(password){
   return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return Jwt.sign(
        {
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresin:process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}

userSchema.methods.refreshAccessToken = function(){
    return Jwt.sign(
        {
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresin:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User = mongoose.model("User",userSchema);