var config = {
  'server': {
    'port': 8888,
    'public_hostname': 'localhost',
    'template_dirs': [
      __dirname + '/jujugui/static/gui/src/app/templates/',
      __dirname + '/jujugui/static/gui/src/app/subapps/browser/templates/'
    ],
    'view_dirs': [
      __dirname + '/jujugui/static/gui/src/lib/views/',
      __dirname + '/jujugui/static/gui/src/lib/views/browser'
    ],
    'scss_dirs': [
      __dirname + '/jujugui/static/gui/src/app/assets/css/'
    ],
    'public_dir': __dirname + '/jujugui/static/gui/build/app'
  }
};

exports.config = config;
