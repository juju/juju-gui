'use strict';

const merge = require('webpack-merge');
const MinifyPlugin = require('babel-minify-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  output: {
    // Change the output filename for production.
    filename: 'init-pkg.js'
  },
  optimization: {
    minimizer: [
      // Optimise the CSS.
      new OptimizeCSSAssetsPlugin({}),
      // Minify the JavaScript.
      new MinifyPlugin()
    ]
  }
});
