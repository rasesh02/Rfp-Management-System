import { client } from '../db/connectPostgres.js';
import {v4 as uuidv4} from 'uuid'


export async function create({name,email,password}){
    const user_id=uuidv4();
    const q=`Insert into users(user_id,name,email,password) values($1,$2,$3,$4) RETURNING *`
    const res=await client.query(q,[user_id,name,email,password]);
    return res.rows[0];
}

export async function getByEmail(email){
    const res=await client.query('Select * from users where email=$1',[email]);
    return res.rows[0];
}

export async function getById(id){
    const res=await client.query('select * from users where user_id=$1',[id]);
    return res.rows[0];
}