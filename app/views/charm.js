YUI.add("juju-view-charm-collection", function(Y) {


var charm_store = new Y.DataSource.IO({
    source: 'http://jujucharms.com:2464/search/json?search_text='
});
   
/*
charm_store.plug(
    Y.Plugin.DataSourceJSONSchema, {
	cfg: {schema: {resultListLocator: "results"}}
    });
charm_store.plug(Y.DataSourceCache, { max: 3});
*/

CharmCollectionView = Y.Base.create('CharmCollectionView', Y.View, [], {

    initializer: function () {
	console.log("View: Initialized: Charm Collection");
        this.set("charms", []);
	this.set('current_request', null);
	Y.one('#omnibar-submit').on("click", Y.bind(this.on_results_change, this));
	this.on_search_change();
    },

    template: Y.Handlebars.compile(Y.one("#t-charm-collection").getHTML()),

    on_search_change: function(evt) {
	console.log('search update');
	var query = Y.one('#charm-search').get('value');

	charm_store.sendRequest({
	    request: query,
	    callback: {
		'success': Y.bind(this.on_results_change, this),
		'failure': function er(e) { console.error(e.error) },
	    }});
    },

    on_results_change: function (io_request) {
	var result_set = Y.JSON.parse(
	    io_request.response.results[0].responseText);
	console.log('results update', result_set, this);
	this.set('charms', result_set.results);
	this.render();
    },

    render: function () {
	console.log('render');
	var container = this.get('container');
        CharmCollectionView.superclass.render.apply(this, arguments);


	var output = this.template({'charms': this.get('charms')});
	console.log("charms render", this.get('charms'));
	console.log(output);
	container.setHTML(output);
        return this;
    }


});

Y.namespace("juju.views").charm_collection = CharmCollectionView;

}, "0.1.0", {
    requires: ['node', 
               'handlebars',
	       'datasource-io',
	       'datasource-jsonschema',
	       'io-base',
	       'json-parse',
               'view']
});

