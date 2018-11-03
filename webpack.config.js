const webpack = require('webpack');
const path = require('path');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// new BundleAnalyzerPlugin()

let config = {
  entry: {
    application: ['./src/entries/entry-point.js', './src/entries/entry-styles.scss'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle-other-prod-optimizers-2.js',
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
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        screw_ie8: true,
        conditionals: true,
        unused: true,
        comparisons: true,
        sequences: true,
        dead_code: true,
        evaluate: true,
        if_return: true,
        join_vars: true
      }
    })
  ]
}
module.exports = config;
