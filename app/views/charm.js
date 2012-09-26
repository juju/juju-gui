'use strict';

YUI.add('juju-view-charm-collection', function(Y) {

  var views = Y.namespace('juju.views'),
      Templates = views.Templates,
      utils = Y.namespace('juju.views.utils');

  Y.Handlebars.registerHelper('iflat', function(iface_decl, options) {
    // console.log('helper', iface_decl, options, this);
    var result = [];
    var ret = '';
    Y.Object.each(iface_decl, function(value, name) {
      if (name) {
        result.push({
          name: name, 'interface': value['interface']
        });
      }
    });

    if (result && result.length > 0) {
      for (var x = 0, j = result.length; x < j; x += 1) {
        ret = ret + options.fn(result[x]);
      }
    } else {
      ret = 'None';
    }
    return ret;
  });

  Y.Handlebars.registerHelper('markdown', function(text) {
    if (!text || text === undefined) {return '';}
    return new Y.Handlebars.SafeString(
        Y.Markdown.toHTML(text));
  });


  var CharmView = Y.Base.create('CharmView', Y.View, [], {
    initializer: function() {
      this.set('charm', null);
      console.log('Loading charm view', this.get('charm_data_url'));
      this.get('charm_store').sendRequest({
        request: this.get('charm_data_url'),
        callback: {
          'success': Y.bind(this.on_charm_data, this),
          'failure': function er(e) {
            console.error(e.error);
          }
        }
      });
    },

    template: Templates.charm,

    render: function() {
      var charm = this.get('charm'),
          container = this.get('container');
      console.log('render', charm);
      CharmCollectionView.superclass.render.apply(this, arguments);
      if (!charm) {
        container.setHTML('<div class="alert">Loading...</div>');
        return;
      }
      // Convert time stamp TODO: should be in db layer
      var last_modified = charm.last_change.created;
      if (last_modified) {
        charm.last_change.created = new Date(last_modified * 1000);
      }

      var settings = utils.extractServiceSettings(charm.config.options);

      container.setHTML(this.template({
        charm: charm,
        settings: settings}));

      container.one('#charm-deploy').on(
          'click', Y.bind(this.on_charm_deploy, this));
      return this;
    },

    on_charm_data: function(io_request) {
      var charm = Y.JSON.parse(
          io_request.response.results[0].responseText);
      console.log('results update', charm, this);
      this.set('charm', charm);
      this.render();
    },

    on_charm_deploy: function(evt) {
      var charm = this.get('charm'),
          container = this.get('container'),
          charmUrl = charm.series + '/' + charm.name,
          env = this.get('env');
      console.log('charm deploy', charm);
      // Generating charm url: see http://jujucharms.com/tools/store-missing
      // for examples of charm addresses.
      if (charm.owner !== 'charmers') {
        charmUrl = '~' + charm.owner + '/' + charmUrl;
      }
      charmUrl = 'cs:' + charmUrl;

      // Gather the configuration values from the form.
      var serviceName = container.one('#service-name').get('value'),
          config = utils.getElementsValuesMapping(container,
          '#service-config .config-field');
      console.log('requested charm configuration', config);


      // The deploy call generates an event chain leading to a call to
      // `app.on_database_changed()`, which re-dispatches the current view.
      // For this reason we need to redirect to the root page right now.
      this.fire('showEnvironment');
      env.deploy(charmUrl, serviceName, config, function(msg) {
        console.log(charmUrl + ' deployed');
      });
    }
  });

  var CharmCollectionView = Y.Base.create('CharmCollectionView', Y.View, [], {

    initializer: function() {
      console.log('View: Initialized: Charm Collection', this.get('query'));
      this.set('charms', []);
      this.set('current_request', null);
      Y.one('#omnibar').on('submit', this.on_search_change, this);
      this.on_search_change();
    },

    template: Templates['charm-collection'],

    render: function() {
      var container = this.get('container'),
          charm = this.get('charm'); // TODO change attribute name to "model"

      CharmCollectionView.superclass.render.apply(this, arguments);
      container.setHTML(this.template({charms: this.get('charms')}));

      // TODO: Use view.events structure to attach this
      container.all('div.thumbnail').each(function(el) {
        el.on('click', function(evt) {
          this.fire('showCharm', {charm_data_url: this.getData('charm-url')});
        });
      });

      return this;
    },

    on_search_change: function(evt) {
      console.log('search update');
      if (evt) {
        evt.preventDefault();
        evt.stopImmediatePropagation();
      }

      var query = Y.one('#charm-search').get('value');
      if (query) {
        this.set('query', query);
      } else {
        query = this.get('query');
      }

      // The handling in datasources-plugins is an example of doing this a bit
      // better ie. io cancellation outstanding requests, it does seem to
      // cause some interference with various datasource plugins though.
      this.get('charm_store').sendRequest({
        request: 'search/json?search_text=' + query,
        callback: {
          'success': Y.bind(this.on_results_change, this),
          'failure': function er(e) { console.error(e.error); }
        }});
    },

    on_results_change: function(io_request) {
      var result_set = Y.JSON.parse(
          io_request.response.results[0].responseText);
      console.log('results update', result_set, this);
      this.set('charms', result_set.results);
      this.render();
    }

  });

  views.charm_collection = CharmCollectionView;
  views.charm = CharmView;

}, '0.1.0', {
  requires: [
    'node',
    'handlebars',
    'datasource-io',
    'datasource-jsonschema',
    'io-base',
    'json-parse',
    'gallery-markdown',
    'view']
});
