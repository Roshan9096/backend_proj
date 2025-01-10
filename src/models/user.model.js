  import bcrypt from 'bcrypt';
import mongoose, { Schema } from 'mongoose';

//   const UserSchema = new mongoose.Schema({})

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    fullname:{
        type:String,
        required:true,
          trim:true,
        index:true
    },
    avatar:{
        type:String,
        required:true
    },
    coverImage:{
        type:String // we use cloudinary url
    },
    watchistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,"password is required"],
        unique:true,
        
    },
    refreshToken:{
        type:String
    }

},{
    timestamps:true
})

//hook
userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPassworsdCorrect = async function (password) {
    return await bcrypt.compare(this.password,password);
}

userSchema.methods.genrateAccesstoken=function(){
    return jwt.sign(
        {
            _id : this.id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIN:process.env.ACCESS_TOKEN_EXPIRY
        }

    )
}

userSchema.methods.genrateRefreshtoken=function(){
    return jwt.sign(
        {
            _id : this.id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIN:process.env.REFRESH_TOKEN_EXPIRY
        }

    )
}
export const User = mongoose.model('User',userSchema)