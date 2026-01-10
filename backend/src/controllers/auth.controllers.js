
import * as userModel from '../models/user.model.js';
import { generateToken } from '../lib/utils/generateToke.js';
import bcrypt from 'bcrypt';

export const signup=async(req,res)=>{
   try {
    const {name,email,password}=req.body;
    if(!name || !email || !password){
        return res.status(400).json({success:false,message:"Name, Email and Password are required"}); 
    }
    const existingUser=await userModel.getByEmail(email);
    if(existingUser){
        return res.status(400).json({success:false,message:"User with this email already exists"});
    }
    const hashedPassword=await bcrypt.hash(password,10);
    const newUser=await userModel.create({name,email,password:hashedPassword});
    const token=generateToken(newUser.user_id);
    res.status(201).json({
        id:newUser.user_id,
        name:newUser.name,
        email:newUser.email,
        token
    })
   } catch (error) {
      console.log("Error in signup controller", error.message);
	 res.status(500).json({ error: "Internal Server Error" });
   }

}

export const login=async(req,res)=>{
    try {
    const {email,password}=req.body;
    if(!email || !password){
        return res.status(400).json({success:false,message:"Email and Password are required"}); 
    }
    const user=await userModel.getByEmail(email);
    const isPasswordCorrect= await bcrypt.compare(password,user?.password || '');
     if (!user || !isPasswordCorrect) {
			return res.status(401).json({ error: "Invalid username or password" });
		}
       //console.log("user id is ",user.user_id);
    const token=generateToken(user.user_id);
    res.status(201).json({
        id: user.user_id,
        name: user.name,
        email: user.email,
        token
    })
    
    } catch (error) {
    console.log("Error in login controller", error.message);
	res.status(500).json({ error: "Internal Server Error" });
    }
}

export const logout=async(req,res)=>{
    try {
    // With header-based auth, client is responsible for discarding the token.
    res.status(200).json({message:"User logged out successfully"})
    } catch (error) {
        console.log("error while logging out ",error);
        res.status(500).json({ error: "Internal Server Error" });
    }

}