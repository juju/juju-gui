'use strict';

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = {
  entry: './jujugui/static/gui/src/app/init.js',
  output: {
    path: path.resolve(__dirname, 'jujugui/static/gui/build/app'),
    filename: 'init-pkg.js',
    library: 'JujuGUI',
    libraryTarget: 'var'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false
            }
          }, {
            loader: 'sass-loader',
            options: {
              includePaths: ['node_modules']
            }
          }
        ]
      }
    ]
  },
  node: {
    fs: 'empty'
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'assets/juju-gui.css',
      chunkFilename: '[id].css'
    })
  ],
  stats: {
    children: false
  }
};
