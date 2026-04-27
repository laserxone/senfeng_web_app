import { Pool } from 'pg';


const pool = new Pool({
    connectionString : process.env.DATABASE_URL
});

// export const karachi_pool = new Pool({
//     connectionString : process.env.KARACHI_DATABASE_URL
// });



export default pool;
