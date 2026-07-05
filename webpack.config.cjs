const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
  entry: path.resolve(appDirectory, "src/app.ts"), //path to the main .ts file
  output: {
    filename: "js/app.js", //name for the javascript file that is created/compiled in memory
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
    }),
  ],
  mode: "development",
};