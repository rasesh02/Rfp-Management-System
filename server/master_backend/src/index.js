import dotenv from "dotenv";
dotenv.config({path:'./.env'});

import {app} from "./app.js";
import connectPostgres from "./db/connectPostgres.js";

connectPostgres().then(()=>{
    app.listen(process.env.PORT || 3000,()=>{
       console.log(`🚀 API Server running at port ${process.env.PORT || 3000}`)
    })
}).catch(err=>{console.log(`❌ Error while listening : ${err}`)})


