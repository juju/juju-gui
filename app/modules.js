GlobalConfig = {
  debug: false,
  ignoreRegistered: true,

  groups: {
    juju: {
      modules: {
        'juju-views': {
          use: [
            'juju-templates',
            'juju-notifications',
            'juju-view-utils',
            'juju-view-environment',
            'juju-view-service',
            'juju-view-unit',
            'juju-view-charm',
            'juju-view-charm-collection'
          ]
        },

        'juju-controllers': {
          use: ['juju-env', 'juju-charm-store', 'juju-notification-controller']
        }
      }
    }
  }
};
