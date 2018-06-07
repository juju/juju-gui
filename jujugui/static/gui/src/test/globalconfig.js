window.juju = {
  utils: {},
  components: {}
};
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
  'base',
  'bundle-import-notifications',
  'model',
  'model-controller',
  'environment-change-set',
  'yui-patches'
];
