const webpack = require('webpack');
const path = require('path');

let config = {
  entry: {
    application: ['./src/entries/entry-point.js', './src/entries/entry-styles.scss'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: 'dist/',
  },
  node: {
    fs: 'empty'
  },
  module: {
  loaders: [
      { test: /\.css$/, loaders: ["style-loader", "css-loader"], exclude: /node_modules/ },
      { test: /\.scss$/, loaders: ["style-loader", "css-loader", "sass-loader"], exclude: /node_modules/ },
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
      { test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ }
    ]
  }
}
module.exports = config;
