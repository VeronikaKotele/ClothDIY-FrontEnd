const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const appDirectory = fs.realpathSync(process.cwd());

module.exports = (_, argv) => {
  const isProduction = argv.mode === "production";

  return {
  entry: path.resolve(appDirectory, "src/app.ts"), //path to the main .ts file
  output: {
    filename: "js/app.js", //name for the javascript file that is created/compiled in memory
    path: path.resolve(appDirectory, "dist"),
    publicPath: isProduction ? "./" : "/",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    extensionAlias: {
      ".js": [".js", ".ts"],
      ".mjs": [".mjs", ".mts"],
      ".cjs": [".cjs", ".cts"],
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  devServer: {
    host: "0.0.0.0",
    port: 8080, //port that we're using for local host (localhost:8080)
    static: [
      {
        directory: path.resolve(appDirectory),
        publicPath: "/",
      },
      {
        directory: path.resolve(appDirectory, "3dModels"),
        publicPath: "/3dModels",
      },
    ],
    hot: true,
    devMiddleware: {
      publicPath: "/",
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(appDirectory, "index.html"),
      cache: false,
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(appDirectory, "3dModels"), to: "3dModels" },
        { from: path.resolve(appDirectory, "public"), to: "public" },
        { from: path.resolve(appDirectory, "src/css"), to: "src/css" },
      ],
    }),
  ],
  mode: isProduction ? "production" : "development",
};
};