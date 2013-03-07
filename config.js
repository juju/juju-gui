var config = {
  'server': {
    'port': 8888,
    'public_hostname': 'localhost',
    'template_dirs': [
      __dirname + '/app/templates/',
      __dirname + '/app/subapps/browser/templates/'
    ],
    'view_dir': __dirname + '/lib/views/',
    'public_dir': __dirname + '/app'
  }
};

exports.config = config;
