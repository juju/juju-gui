'use strict';

(function() {

  describe('juju charm collection view', function() {
    var CharmCollectionView, localCharmStore, searchInput, views, Y;

    var charmSearchQuery = 'mongodb';

    var charmSearchResults = {
      'matches': 6,
      'charm_total': 429,
      'results_size': 6,
      'search_time': 0.00102,
      'results': [
        {
                    'data_url': '/charms/precise/cf-mongodb/json',
                    'name': 'cf-mongodb',
                    'series': 'precise',
                    'summary':
                        'An object/document-oriented database (metapackage)',
                    'relevance': 29.6,
                    'owner': 'charmers'
        },
        {
                    'data_url': '/charms/precise/mongodb/json',
                    'name': 'mongodb',
                    'series': 'precise',
                    'summary':
                        'An object/document-oriented database (metapackage)',
                    'relevance': 24.5,
                    'owner': 'charmers'
        },
        {
                    'data_url': '/charms/oneiric/cf-mongodb/json',
                    'name': 'cf-mongodb',
                    'series': 'oneiric',
                    'summary':
                        'An object/document-oriented database (metapackage)',
                    'relevance': 29.7,
                    'owner': 'charmers'
        },
        {
                    'data_url': '/charms/oneiric/mongodb/json',
                    'name': 'mongodb',
                    'series': 'oneiric',
                    'summary':
                        'An object/document-oriented database (metapackage)',
                    'relevance': 28.6,
                    'owner': 'charmers'
        },
        {
                    'data_url': '/~flepied/precise/mongodb/json',
                    'name': 'mongodb',
                    'series': 'precise',
                    'summary':
                        'An object/document-oriented database (metapackage)',
                    'relevance': 28.6,
                    'owner': 'flepied'
        },
        {
                    'data_url': '/~negronjl/precise/mongodb/json',
                    'name': 'mongodb',
                    'series': 'precise',
                    'summary':
                        'An object/document-oriented database (metapackage)',
                    'relevance': 24.5,
                    'owner': 'negronjl'
        }
      ]
    };

    before(function(done) {
      Y = YUI(GlobalConfig).use(['juju-views'], function(Y) {
        views = Y.namespace('juju.views');
        CharmCollectionView = views.charm_collection;
        // Use a local charm store.
        localCharmStore = new Y.DataSource.Local({
          source: [{
            responseText: Y.JSON.stringify(charmSearchResults)
          }]
        });
        done();
      });
    });

    // Ensure the charm collection view correctly handles results.
    it('must be able to fetch search results', function() {
      var MyView = Y.Base.create('MyView', CharmCollectionView, [], {
        // Overriding to check the results returned by the local
        // charm store.
        on_results_change: function(io_request) {
          MyView.superclass.on_results_change.apply(this, arguments);
          var charms = this.get('charms');
          for (var i = 0; i < charms.length; i++) {
            charms[i].name.should.contain(charmSearchQuery);
          }
        }
      });
      new MyView({
        query: charmSearchQuery,
        charm_store: localCharmStore
      });
    });

    // Ensure the search results are rendered inside the container.
    it('must correctly render the search results', function() {
      var container = Y.Node.create('<div id="test-container" />');
      var MyView = Y.Base.create('MyView', CharmCollectionView, [], {
        // Overriding to check the results as they are rendered in
        // the container. Subclassing is required because render() is
        // called by the `on_results_change` event handler.
        render: function() {
          MyView.superclass.render.apply(this, arguments);
          var charms = container.all('.thumbnails > li');
          // An element is rendered for each result.
          charms.size().should.equal(
              charmSearchResults.results_size);
          // Each result contains the query string.
          charms.each(function(item) {
            item.getHTML().should.contain(charmSearchQuery);
          });
          container.destroy();
        }
      });
      new MyView({
        container: container,
        query: charmSearchQuery,
        charm_store: localCharmStore
      });
    });

  });

})();
