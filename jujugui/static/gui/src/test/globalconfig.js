var GlobalConfig = {
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
  }
};

GlobalConfig.test_url = window.location.protocol + '//' + window.location.host + "/base/jujugui/static/gui/src/test/";
