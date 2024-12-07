const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  entry: "./src/server.ts", // Entry point của ứng dụng
  target: "node", // Dự án Node.js
  mode: "production", // Cố định chế độ luôn là production
  module: {
    rules: [
      {
        test: /\.ts$/, // Kiểm tra các file có đuôi .ts
        use: "ts-loader", // Sử dụng ts-loader để biên dịch TypeScript
        exclude: /node_modules/, // Loại trừ thư mục node_modules
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"], // Cho phép Webpack nhận dạng các file .ts và .js
  },
  output: {
    filename: "server.js", // Tên file output
    path: path.resolve(__dirname, "dist"), // Thư mục chứa file output
  },
  externals: [nodeExternals()], // Loại trừ các node_modules khỏi bundle
  devtool: false, // Không tạo source map trong môi trường production
  optimization: {
    minimize: true, // Tối ưu hóa và minify mã trong môi trường production
  },
};
