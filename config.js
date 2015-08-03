var config = {
  'server': {
    'port': 8888,
    'public_hostname': 'localhost',
    'template_dirs': [
      __dirname + '/app/templates/',
      __dirname + '/app/subapps/browser/templates/'
    ],
    'scss_dirs': [
      // Must have the top level path first.
      __dirname + '/app/assets/css/',
      __dirname + '/app/assets/css/browser',
      __dirname + '/app/assets/css/inspector',
      __dirname + '/app/assets/css/machine-view'
    ],
    'public_dir': __dirname + '/app'
  }
};

exports.config = config;
