"use strict";

(function () {

    describe('juju charm collection view', function() {
        var CharmCollectionView, localCharmStore, searchInput,
            testData, views, Y;

        before(function (done) {
            Y = YUI(GlobalConfig).use(
                ['juju-views', 'juju-tests-data'], function (Y) {
                testData = Y.namespace('juju-tests.data');
                views = Y.namespace('juju.views');
                CharmCollectionView = views.charm_collection;
                // Use a local charm store.
                localCharmStore = new Y.DataSource.Local({
                    source: [{
                        responseText: Y.JSON.stringify(
                            testData.charmSearchResults)
                    }]
                });
                // Add a search input inside the `omnibar` element.
                searchInput = Y.Node.create(
                    '<input id="charm-search" name="query" type="text" />'
                ).hide();
                Y.one('#omnibar').append(searchInput);
                done();
            });
        });

        after(function (done) {
            // Clean up the search input added before.
            searchInput.remove(true);
            done();
        });

        // Ensure the charm collection view correctly handles results.
        it('must be able to fetch search results', function() {
            var MyView = Y.Base.create('MyView', CharmCollectionView, [], {
                // Override to check the results returned by the local charm
                // store.
                on_results_change: function (io_request) {
                    MyView.superclass.on_results_change.apply(this, arguments);
                    var charms = this.get('charms');
                    for (var i = 0; i < charms.length; i++) {
                        charms[i].name.should.contain(
                            testData.charmSearchQuery);
                    }
                }
            });
            var view = new MyView({
                query: testData.charmSearchQuery,
                charm_store: localCharmStore});
        });

    });

})();


/*

+ merge trunk
+ controllare charm_store passato dinamicamente alla charm view
+ controllare charm_store passato dinamicamente alla charm collection view
+ modificare test_view in modo che aggiunga la search input dinamicamente
  (da rimuovere in tearDown)
- modifica test in modo da usare dati veri:
  http://jujucharms.com/search/json?search_text=mongodb
- nuovo test con render e controllo charm in dom
- fix mess in search.js e subscription in charm collection (deve puntare a un altro metodo)
- controllare che la view non venga rigenerata quando è già attiva
- controllare che la ricerca funzioni quando la view è già attiva


*/
