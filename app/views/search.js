"use strict";

var YUI = require("yui").YUI;

YUI.add("juju-view-charmsearch", function(Y) {

var views = Y.namespace("juju.views");

var NavigationBarView = Y.Base.create('NavigationBarView', Y.View, [], {

    initializer: function () {
        Y.log("View: Initialized: Charm Search");
        // This view is always attached / else remove this when no longer valid.
        // The App framework only sets the activeView up as a target (v3.6.0)
        this.addTarget(this.get('app'));
        this.publish('showCharmCollection', {preventable: false, broadcast: true});
    },

    render: function () {
        /* Navigation bar search defaults to show detailed charm collection results.
        var app = Y.namespace("juju").AppInstance;
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
            source: app.get('charm_search_url') + 'search/json?search_text={query}'
        });
        */

        Y.one('#omnibar').on('submit', Y.bind(this.show_charm_store, this));
        return this;
    },

    show_charm_store: function(evt) {

        console.log("clicked search");
        var app = this.get('app');
        evt.preventDefault();
        evt.stopImmediatePropagation();

        // if we're already on the page dont render.
        if (app.get('activeView') == 'CharmCollectionView')
            return;

        var charm_url = Y.one('#charm-search').get('value');
        console.log('Fire show charm collection', this, charm_url);
        this.fire('showCharmCollection', {query: charm_url});
    }

});

views.charm_search = NavigationBarView;
}, "0.1.0", {
    requires: ['autocomplete',
               'autocomplete-filters',
               'autocomplete-highlighters']
});
