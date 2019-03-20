'use strict';

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = {
  entry: './jujugui/static/gui/src/app/init.js',
  output: {
    path: path.resolve(__dirname, 'static/build'),
    filename: 'init-pkg.js',
    // Build the package so that when it is loaded in the browser it can be accessed
    // via variable named JujuGUI.
    library: 'JujuGUI',
    libraryTarget: 'var'
  },
  module: {
    rules: [
      // Use Babel on all our files, but not node_modules.
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      // Load all the require()ed scss and pass it to the css extractor.
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              // This stops the asset URLs from being modified. We want them to remain as
              // relative urls e.g. static/svgs.. will resolve in Juju to /gui/static/svgs/...
              url: false
            }
          }, {
            loader: 'sass-loader',
            options: {
              // Include node_modules for @imports e.g. for normalize.css
              includePaths: ['node_modules']
            }
          }
        ]
      }
    ]
  },
  node: {
    // Let Webpack handle the fs for the web as we're not building for node.
    // See: https://webpack.js.org/configuration/node/#other-node-core-libraries
    fs: 'empty'
  },
  plugins: [
    // Output the CSS to the build dir.
    new MiniCssExtractPlugin({
      // This file is relative to output.path above.
      filename: 'juju-gui.css',
      chunkFilename: '[id].css'
    })
  ],
  stats: {
    // This hides the output from MiniCssExtractPlugin as it's incredibly verbose.
    children: false
  }
};
