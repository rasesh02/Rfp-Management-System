import jwt from 'jsonwebtoken';

export const protectRoute= async(req,res,next)=>{
    try {
       let token;
       if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token=req.headers.authorization.split(' ')[1];
       }    
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No Token Provided" });
        }
      const decoded=jwt.verify(token,process.env.JWT_SECRET_KEY);
      req.user={id:decoded.userId};
      next();
    } catch (error) {
        return res.status(401).json({ error: "Unauthorized: Invalid Token" });
    }
}