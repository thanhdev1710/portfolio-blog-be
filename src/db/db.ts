import * as schema from "./schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import logger from "../utils/logger";

const sslConfig =
  process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: true } // Bật SSL trong môi trường production
    : false;

// Deploy thì bỏ sslConfig và không sử dụng là false
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT
    ? parseInt(process.env.PG_IDLE_TIMEOUT)
    : 30000,
  connectionTimeoutMillis: process.env.PG_CONN_TIMEOUT
    ? parseInt(process.env.PG_CONN_TIMEOUT)
    : 20000,
});

// Kiểm tra kết nối
pool
  .connect()
  .then((client) => {
    logger.info("Database connected successfully");
    client.release(); // Giải phóng ngay lập tức
  })
  .catch((err) => {
    logger.error("Failed to connect to the database", err.stack || err);
    // process.exit(1); // Thoát chương trình nếu không thể kết nối
  });

export const db = drizzle({ client: pool, schema });

export async function closePool() {
  try {
    await pool.end(); // Đóng tất cả kết nối trong pool
    logger.info("Pool closed");
  } catch (err: any) {
    logger.error("Error closing pool", err.stack || err);
  }
}
