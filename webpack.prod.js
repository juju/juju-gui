'use strict';

const merge = require('webpack-merge');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: 'init-pkg-min.js'
  },
  optimization: {
    minimizer: [
      new OptimizeCSSAssetsPlugin({}),
      new MinifyPlugin()
    ]
  }
});
