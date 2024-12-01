import dotenv from "dotenv";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const result = dotenv.config();
if (result.error) {
  console.error("Error loading .env file:", result.error);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV?.toLowerCase() === "production"
      ? { rejectUnauthorized: false }
      : false,
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT
    ? parseInt(process.env.PG_IDLE_TIMEOUT)
    : 30000,
  connectionTimeoutMillis: process.env.PG_CONN_TIMEOUT
    ? parseInt(process.env.PG_CONN_TIMEOUT)
    : 2000,
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
    process.exit(1); // Thoát chương trình nếu không thể kết nối
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
