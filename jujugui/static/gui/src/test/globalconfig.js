window.juju = {
  utils: {},
  components: {}
};
window.juju.utils.RelationUtils = require('../app/init/relation-utils');
window.GlobalConfig = {
  combine: true,
  base: '/dev/combo?/app/assets/javascripts/yui/',
  comboBase: '/dev/combo?',
  maxURLLenght: 1300,
  root: 'app/assets/javascripts/yui/',
  groups: {
    app: {
        //combine: true,
        base: "/dev/combo?app/",
        comboBase: "/dev/combo?",
        root: 'app/',
        filter: 'raw',
        // From modules.js
        modules: YUI_MODULES,
    },
  },
  test_url: window.location.protocol + '//' + window.location.host + "/base/jujugui/static/gui/src/test/"
};
window.MODULES = [
  'juju-charm-models',
  'juju-bundle-models',
  'juju-controller-api',
  'juju-env-base',
  'juju-env-api',
  'juju-models',
  // juju-views group
  'juju-landscape',
  // end juju-views group
  'io',
  'json-parse',
  'app-base',
  'app-transitions',
  'base',
  'bundle-import-notifications',
  'node',
  'model',
  'cookie',
  'querystring',
  'event-key',
  'event-touch',
  'model-controller',
  'ghost-deployer-extension',
  'environment-change-set',
  'yui-patches'
];
