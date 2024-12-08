import { configDotenv } from "dotenv";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

configDotenv();

export const pool = new Pool({
  port: Number(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT
    ? parseInt(process.env.PG_IDLE_TIMEOUT)
    : 30000,
  connectionTimeoutMillis: process.env.PG_CONN_TIMEOUT
    ? parseInt(process.env.PG_CONN_TIMEOUT)
    : 20000,
  ssl: false,
});

// Kiểm tra kết nối
pool
  .connect()
  .then((client) => {
    console.log("Database connected successfully");
    client.release(); // Giải phóng ngay lập tức
  })
  .catch((err) => {
    console.error("Failed to connect to the database", err.stack || err);
    // process.exit(1); // Thoát chương trình nếu không thể kết nối
  });

export const db = drizzle({ client: pool, schema });

export async function closePool() {
  try {
    await pool.end(); // Đóng tất cả kết nối trong pool
    console.log("Pool closed");
  } catch (err: any) {
    console.error("Error closing pool", err.stack || err);
  }
}
