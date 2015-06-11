var config = {
  'server': {
    'port': 8888,
    'public_hostname': 'localhost',
    'template_dirs': [
      __dirname + '/app/templates/',
      __dirname + '/app/subapps/browser/templates/'
    ],
    'scss_dirs': [
      __dirname + '/app/assets/css/'
    ],
    'public_dir': __dirname + '/app'
  }
};

exports.config = config;
