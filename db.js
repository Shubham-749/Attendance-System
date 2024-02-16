// db.js
import pkg from 'pg';
const { Pool } = pkg;

import Redis from 'ioredis';
import dotenv from 'dotenv'; 

dotenv.config(); 
const redisClient = new Redis();

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

export { pool, redisClient };
