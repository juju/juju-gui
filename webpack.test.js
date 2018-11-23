'use strict';


module.exports = {
  mode: 'development',
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
        use: [{
          loader: 'css-loader',
          options: {
            url: false
          }
        }, {
          loader: 'sass-loader',
          options: {
            includePaths: ['node_modules']
          }
        }]
      }
    ]
  },
  node: {
    fs: 'empty'
  }
};
