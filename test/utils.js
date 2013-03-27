'use strict';
// Test utils.

YUI(GlobalConfig).add('juju-tests-utils', function(Y) {
  var jujuTests = Y.namespace('juju-tests');

  jujuTests.utils = {

    SocketStub: function() {
      this.messages = [];

      this.close = function() {
        this.messages = [];
      };

      this.transient_close = function() {
        this.onclose();
      };

      this.open = function() {
        this.onopen();
        return this;
      };

      this.msg = function(m) {
        this.onmessage({'data': Y.JSON.stringify(m)});
      };

      this.last_message = function(back) {
        if (!back) {
          back = 1;
        }
        return this.messages[this.messages.length - back];
      };

      this.send = function(m) {
        this.messages.push(Y.JSON.parse(m));
      };

      this.onclose = function() {};
      this.onmessage = function() {};
      this.onopen = function() {};

    },

    getter: function(attributes, default_) {
      return function(name) {
        if (attributes.hasOwnProperty(name)) {
          return attributes[name];
        } else {
          return default_;
        }
      };
    },

    setter: function(attributes) {
      return function(name, value) {
        attributes[name] = value;
      };
    },

    makeCharmStore: function() {
      var data = [];
      var charmStore = new Y.juju.CharmStore(
          {datasource: new Y.DataSource.Local({source: data})});
      var setCharm = function(name) {
        data[0] = Y.io('data/' + name + '-charmdata.json', {sync: true});
      };
      setCharm('wordpress');
      return {charmStore: charmStore, setCharm: setCharm};
    },

    makeFakeBackendWithCharmStore: function() {
      var charmStoreData = jujuTests.utils.makeCharmStore();
      var fakebackend = new Y.juju.environments.FakeBackend(
          {charmStore: charmStoreData.charmStore});
      fakebackend.login('admin', 'password');
      return {fakebackend: fakebackend, setCharm: charmStoreData.setCharm};
    }

  };

}, '0.1.0', {
  requires: [
    'io',
    'datasource-local',
    'juju-charm-store',
    'juju-env-fakebackend'
  ]
});
