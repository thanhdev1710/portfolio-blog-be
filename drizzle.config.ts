import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/db", // Đặt đường dẫn đúng tới thư mục bạn muốn lưu schema
  schema: "./src/db/schema.ts", // Đường dẫn của schema file
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
