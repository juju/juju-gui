YUI.add("juju-view-charmsearch", function(Y) {

var views = Y.namespace("juju.views");
            

CharmStoreSearch = Y.Base.create('CharmStoreSearch', Y.View, [], {

    initializer: function () {
	console.log("View: Initialized: Charm Search")
	this.publish('showCharmCollection', {preventable: false});
    },

    render: function () {
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
	charm_url = Y.one('#charm-search').get('value');
	console.log('Fire show charm collection', this, charm_url);
	this.fire('showCharmCollection', {query: charm_url});
//	this.get('app').env.deploy(charm_url);
    }

});

views.charm_search = CharmStoreSearch
}, "0.1.0", {
    requires: ['autocomplete', 'autocomplete-filters', 'autocomplete-highlighters']
});
