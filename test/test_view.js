(function () {

    describe('juju charm collection view', function() {
        var localCharmStore, View, views, Y;

        before(function (done) {
            Y = YUI(GlobalConfig).use('juju-views', function (Y) {
                views = Y.namespace('juju.views');
                CharmCollectionView = views.charm_collection;
                // Use a local charm store.
                localCharmStore = new Y.DataSource.Local({
                    source: [{
                        responseText: Y.JSON.stringify({
                            results: [{name: 'result 1'}, {name: 'result 2'}]
                        })
                    }]
                });
                done();
            });
        });

        // Ensure the charm collection view correctly handles results.
        it('must be able to fetch search results', function() {
            var query = 'result';
            MyView = Y.Base.create('MyView', CharmCollectionView, [], {
                // Override to check the results returned by the local charm
                // store.
                on_results_change: function (io_request) {
                    MyView.superclass.on_results_change.apply(this, arguments);
                    var charms = this.get('charms');
                    for (var i = 0; i < charms.length; i++) {
                        charms[i].name.should.contain(query);
                    }
                }
            });
            var view = new MyView({
                query: query, charm_store: localCharmStore});
        });

    });

})();
