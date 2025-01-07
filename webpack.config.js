const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  entry: "./src/server.ts", // Entry point cho server
  target: "node", // Dự án Node.js
  mode: "production", // Chế độ production
  module: {
    rules: [
      {
        test: /\.ts$/, // Dùng ts-loader cho các file .ts
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true, // Tăng tốc độ build
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"], // Hỗ trợ mở rộng các file .ts và .js
    fallback: {
      fs: false, // Cấm bundling các module không cần thiết như fs
      path: false,
      os: false,
    },
  },
  output: {
    filename: "server.js", // Tên file output
    path: path.resolve(__dirname, "dist"), // Đường dẫn đến thư mục dist
    clean: true, // Xóa thư mục output trước khi build
  },
  externals: [
    nodeExternals({
      allowlist: ["winston"], // Đảm bảo `winston` không bị loại bỏ trong bundling
    }),
  ],
  optimization: {
    minimize: true, // Minimize mã nguồn trong production
    usedExports: true, // Bật tree-shaking (loại bỏ mã không sử dụng)
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production"), // Cố định môi trường production
    }),
  ],
  cache: {
    type: "filesystem", // Lưu cache trên ổ đĩa để tăng tốc quá trình build
  },
};
