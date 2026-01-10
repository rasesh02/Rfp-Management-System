import dotenv from 'dotenv';
dotenv.config({path:'./.env'});

import connectPostgres from "./config/db.js";
import { app } from "./app.js";

// Start only the Express API server
connectPostgres().then(()=>{
    app.listen(process.env.PORT || 3000,()=>{
       console.log(`🚀 API Server running at port ${process.env.PORT || 3000}`)
    })
}).catch(err=>{console.log(`❌ Error while listening : ${err}`)})
