const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
  entry: {
    bundle: "./src/index.js",
  },

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },

  mode: "production",
  devtool: "source-map",

  devServer: {
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    port: 3000,
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [{ loader: "babel-loader" }],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      title: "NCALayer Stimulus Demo",
      filename: "index.html",
      template: "src/index.html",
    }),
  ],
}
