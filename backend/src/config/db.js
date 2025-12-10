import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const client = new Client({
  connectionString: process.env.POSTGRES_URL || ""
});


export const connectPostgres=async()=>{
    try{
      await client.connect();
      console.log("Postgres client connected");
    }
    catch(error){
      console.error("Postgres connection error:", error);
    }
}


export default connectPostgres;

