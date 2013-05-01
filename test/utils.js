'use strict';
// Test utils.

YUI(GlobalConfig).add('juju-tests-utils', function(Y) {
  var jujuTests = Y.namespace('juju-tests');

  jujuTests.utils = {
    makeContainer: function() {
      var container = Y.Node.create('<div>');
      container.appendTo(document.body);
      container.setStyle('position', 'absolute');
      container.setStyle('top', '-10000px');
      container.setStyle('left', '-10000px');
      return container;
    },

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

    _cached_charms: (function() {
      var charms = {},
          names = [
            'wordpress', 'mysql', 'puppet', 'haproxy', 'mediawiki', 'hadoop'];
      Y.Array.each(names, function(name) {
        charms[name] = Y.JSON.parse(
            Y.io('data/' + name + '-charmdata.json', {sync: true})
            .responseText);
      });
      return charms;
    })(),

    TestCharmStore: Y.Base.create(
        'test-charm-store', Y.juju.CharmStore, [], {
          loadByPath: function(path, options) {
            var charmName = path.split('/')[2];
            var found = Y.Array.some(
                Y.Object.values(jujuTests.utils._cached_charms),
                function(data) {
                  if (data.name === charmName) {
                    options.success(data);
                    return true;
                  }
                });
            if (!found) {
              options.failure();
            }
          }
        }
    ),

    makeFakeBackendWithCharmStore: function() {
      var fakebackend = new Y.juju.environments.FakeBackend(
          {charmStore: new jujuTests.utils.TestCharmStore()});
      fakebackend.login('admin', 'password');
      return fakebackend;
    },

    /**
     * Util to load a fixture (typically as 'data/filename.json').
     *
     * @method loadFixture
     * @param {String} url to synchronously load.
     * @param {Boolean} parseJSON when true return will be processed
     *                  as a JSON blob before returning.
     * @return {Object} fixture data resulting from call.
     */
    loadFixture: function(url, parseJson) {
      var response = Y.io(url, {sync: true}).responseText;
      if (parseJson) {
        response = Y.JSON.parse(response);
      }
      return response;
    }
  };

}, '0.1.0', {
  requires: [
    'io',
    'node',
    'json-parse',
    'datasource-local',
    'juju-charm-store',
    'juju-env-fakebackend'
  ]
});
