const webpack = require('webpack');
const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// new BundleAnalyzerPlugin()

let config = {
  entry: {
    application: ['./src/entries/entry-point.js', './src/entries/entry-styles.scss'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle-fonts.js',
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
    new CompressionPlugin({
      filename: '[path].gz[query]',
      algorithm: 'gzip',
      test: /\.js$|\.css$|\.html$|\.eot?.+$|\.ttf?.+$|\.woff?.+$|\.svg?.+$/,
      threshold: 10240,
      minRatio: 0.8
    }),
    // new webpack.HotModuleReplacementPlugin()
  ]
}
module.exports = config;
