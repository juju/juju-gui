YUI.add("juju-view-charmsearch", function(Y) {

var views = Y.namespace("juju.views");
            

CharmStoreSearch = Y.Base.create('CharmStoreSearch', Y.View, [], {

    initializer: function () {
	Y.log("View: Initialized: Charm Search");
	// This view is always attached / else remove this when no longer valid.
	// The App framework only sets the activeView up as a target (v3.6.0)
	this.addTarget(this.get('app'));
	this.publish('showCharmCollection', {preventable: false, broadcast: true});
    },

    render: function () {
	Y.one('#charm-search').plug(Y.Plugin.AutoComplete, {
	    resultHighlighter: 'phraseMatch',
	    minQueryLength: 3,
	    resultListLocator: 'results',
	    resultTextLocator: function (result) {
		if (result.owner == 'charmers') {
		    return result.series + "/" + result.name;
		}
		return result.owner + "/" + result.series + "/" + result.name;
	    },
	    source: 'http://jujucharms.com:2464/search/json?search_text={query}'
	});

	Y.one('#omnibar-submit').on(
	    'click', Y.bind(this.deploy_charm, this));
        return this;
    },

    deploy_charm: function(evt) {
        var app = this.get('app');
	evt.preventDefault();
	evt.stopImmediatePropagation();

	if (app.get('activeView') == 'CharmCollectionView') 
	    return

	charm_url = Y.one('#charm-search').get('value');
	console.log('Fire show charm collection', this, charm_url);
	this.fire('showCharmCollection', {query: charm_url});
    }

});

views.charm_search = CharmStoreSearch;
}, "0.1.0", {
    requires: ['autocomplete', 
               'autocomplete-filters', 
               'autocomplete-highlighters']
});
