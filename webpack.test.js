'use strict';

module.exports = {
  mode: 'development',
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
      // Load all the require()ed scss.
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
    // Let Webpack handle the fs for the web as we're not building for node.
    // See: https://webpack.js.org/configuration/node/#other-node-core-libraries
    fs: 'empty'
  }
};
