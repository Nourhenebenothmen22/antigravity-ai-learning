import User from "../models/user.js";
export const verifyEmail=async(email)=>{
    const existUser=await User.findOne({email})
    return !!existUser;

}