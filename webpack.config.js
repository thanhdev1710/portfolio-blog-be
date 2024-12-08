const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  entry: "./src/server.ts", // Entry point
  target: "node", // Dự án Node.js
  mode: "production", // Chế độ production
  module: {
    rules: [
      {
        test: /\.ts$/,
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
    extensions: [".ts", ".js"],
    fallback: {
      fs: false,
      path: false,
      os: false,
    },
  },
  output: {
    filename: "server.js",
    path: path.resolve(__dirname, "dist"),
    clean: true, // Xóa thư mục output trước khi build
  },
  externals: [
    nodeExternals({
      allowlist: [], // Bao gồm package nếu cần
    }),
  ],
  optimization: {
    minimize: true,
    usedExports: true, // Bật tree-shaking
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production"), // Cố định môi trường production
    }),
  ],
  cache: {
    type: "filesystem", // Lưu cache trên ổ đĩa
  },
};
