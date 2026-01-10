import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login(){
    const navigate=useNavigate();
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    const [loading, setLoading] = useState(false);
    
    // Basic validation
    const validate = () => {
    if (!email.trim()) return setError("Enter username or email"), false;
    if (!password) return setError("Password required"), false;
    return true;
    };

    async function handleSubmit(email,password){
      if (!validate()) return;
      setLoading(true);
      try {
        const res= await fetch('',{
           method: "POST",
           headers: {"Content-Type": "application/json"},
           body: JSON.stringify({ email: email.trim(), password }),
        });
        console.log(res)
        if(!res.ok) throw new Error("Invalid email/password");
        const data= await res.json();
        if(data.token){
            localStorage.setItem("token",data.token);
        }
        const user={
            id: data.id,
            name: data.name
        }
        //missing

        navigate("/",{replace: true});

      }catch (err) {
        //add setError
      setError(err.message);
    } finally {
      setLoading(false);
    }
    }
    return (
        <div>

            {/* Email */}
            <div>
                <label>Email</label>
                <input 
                  placeholder="Enter your Email"
                  value={email} 
                  onChange={(e)=>setEmail(e.target.value)}
                />
            </div>

            {/* Password */}
            <div>
                 <label>Password</label>
                <input 
                  placeholder="Enter your Password"
                  value={password} 
                  onChange={(e)=>setPassword(password)}
                />
            </div>
            {/* Submit Button */}
            <button onClick={()=>handleSubmit(email,password)}>
                Enter
            </button>
        </div>
    )
}
