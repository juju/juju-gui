// This is a temp view to get the router working
// remove later, testing basic routing in App

YUI.add("juju-view-charmsearch", function(Y) {

var views = Y.namespace("juju.views");
            

CharmStoreSearch = Y.Base.create('CharmStoreSearch', Y.View, [], {

    initializer: function () {
	console.log("initialized store search view");
    },

    render: function () {
	console.log("rendering");  
	Y.one('#charm-search').plug(Y.Plugin.AutoComplete, {
	    resultHighlighter: 'phraseMatch',
	    minQueryLength: 2,

	    resultListLocator: 'results',
	    resultTextLocator: function (result) {
		if (result.owner == 'charmers') {
		    return result.series + "/" + result.name;
		}
		return result.owner + "/" + result.series + "/" + result.name;
	    },
	    source: "http://jujucharms.com:2464/search/json?search_text={query}"
	});

	Y.one('#charm-deploy').on(
	    'click', Y.bind(this.deploy_charm, this));
        return this;
    },

    deploy_charm: function(evt) {
	evt.preventDefault();
	evt.stopImmediatePropagation();
//	evt.stop();
	var app;
	charm_url = Y.one('#charm-search').get('value');
	console.log('deploying charm', this, charm_url);
	app = this.get('app')
	app.deploy(charm_url);

    }

});

views.charm_search = CharmStoreSearch
}, "0.1.0", {
    requires: ['autocomplete', 'autocomplete-filters', 'autocomplete-highlighters']
});
