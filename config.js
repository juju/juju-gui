var config = {
  'server': {
    'port': 8888,
    'public_hostname': 'localhost',
    'template_dirs': [
      __dirname + '/app/templates/',
      __dirname + '/app/subapps/browser/templates/'
    ],
    'view_dirs': [
      __dirname + '/lib/views/',
      __dirname + '/lib/views/browser'
    ],
    'scss_dirs': [
      __dirname + '/app/assets/css/'
    ],
    'public_dir': __dirname + '/app'
  }
};

exports.config = config;
