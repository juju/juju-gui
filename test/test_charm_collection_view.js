'use strict';

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
                done();
            });
        });

        // Ensure the charm collection view correctly handles results.
        it('must be able to fetch search results', function() {
            var MyView = Y.Base.create('MyView', CharmCollectionView, [], {
                // Overriding to check the results returned by the local
                // charm store.
                on_results_change: function (io_request) {
                    MyView.superclass.on_results_change.apply(this, arguments);
                    var charms = this.get('charms');
                    for (var i = 0; i < charms.length; i++) {
                        charms[i].name.should.contain(
                            testData.charmSearchQuery);
                    }
                }
            });
            new MyView({
                query: testData.charmSearchQuery,
                charm_store: localCharmStore});
        });

        // Ensure the search results are rendered inside the container.
        it('must correctly render the search results', function() {
            var container = Y.Node.create('<div id="test-container" />');
            var MyView = Y.Base.create('MyView', CharmCollectionView, [], {
                // Overriding to check the results as they are rendered in
                // the container.
                render: function () {
                    MyView.superclass.render.apply(this, arguments);
                    var charms = container.all('.thumbnails > li');
                    // An element is rendered for each result.
                    charms.size().should.equal(
                        testData.charmSearchResults.results_size);
                    // Each result contains the query string.
                    charms.each(function(item) {
                        item.getHTML().should.contain(
                            testData.charmSearchQuery);
                    });
                    container.destroy();
                }
            });
            new MyView({
                container: container,
                query: testData.charmSearchQuery,
                charm_store: localCharmStore});
        });

    });

})();
