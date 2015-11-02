var config = {
  'server': {
    'port': 8888,
    'public_hostname': 'localhost',
    'template_dirs': [
      __dirname + '/jujugui/static/gui/src/app/templates/'
    ],
    'view_dirs': [
      __dirname + '/jujugui/static/gui/src/lib/views/',
      __dirname + '/jujugui/static/gui/src/lib/views/browser'
    ],
    'scss_dirs': [
      // Must have the top level path first.
      __dirname + '/jujugui/static/gui/src/app/assets/css/',
      __dirname + '/jujugui/static/gui/src/app/assets/css/machine-view'
    ],
    'public_dir': __dirname + '/jujugui/static/gui/build/app'
  }
};

exports.config = config;
