const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require('webpack');

// Determine log level from environment variable set by cross-env
// Default to 'INFO' for dev if not set, 'DEBUG' for dev:verbose
const logLevel = process.env.LOG_LEVEL || 'INFO'; 

module.exports = {
  entry: "./src/index.js",
  // devtool: 'eval',

  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },

  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/template.html",
      filename: "index.html",
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.LOG_LEVEL': JSON.stringify(logLevel)
    })
  ],

  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    compress: true,
    port: 9000,
    hot: true,
    open: true,
  },
};
