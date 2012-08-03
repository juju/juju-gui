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
	    source: "http://jujucharms.com/search/json?search_text={query}"
	});
        return this;
    }
});

views.charm_search = CharmStoreSearch
}, "0.1.0", {
    requires: ['autocomplete', 'autocomplete-filters', 'autocomplete-highlighters']
});
