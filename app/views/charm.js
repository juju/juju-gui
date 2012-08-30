YUI.add("juju-view-charm-collection", function(Y) {

var views = Y.namespace("juju.views"),
    Templates = views.Templates;

var charm_store;
/*
charm_store.plug(
    Y.Plugin.DataSourceJSONSchema, {
       cfg: {schema: {resultListLocator: "results"}}
    });
charm_store.plug(Y.DataSourceCache, { max: 3});
*/


Y.Handlebars.registerHelper('iflat', function(iface_decl, options) {
    // console.log('helper', iface_decl, options, this);
    var result = [];
    var ret = "";
    for (var i in iface_decl) {
        if (!i)
            continue;
        result.push({
            'name': i,
            'interface': iface_decl[i]['interface']});
    }

    if (result && result.length > 0) {
        for (var x=0, j=result.length; x<j; x++) {
            ret = ret + options.fn(result[x]);
        }
    } else {
        ret = "None";
    }
    return ret;
});

Y.Handlebars.registerHelper('markdown', function(text) {
    if (!text || text == undefined) {return '';}
    return new Y.Handlebars.SafeString(
        Y.Markdown.toHTML(text));
});


CharmView = Y.Base.create('CharmView', Y.View, [], {
    initializer: function () {
        this.set('charm', null);
        var app = Y.namespace("juju").AppInstance;
        if (app && !charm_store) {
            charm_store = new Y.DataSource.IO({
                    source: app.get('charm_store_url')
            });
        }
        console.log("Loading charm view", this.get('charm_data_url'));
        charm_store.sendRequest({
        request: this.get('charm_data_url'),
        callback: {
            'success': Y.bind(this.on_charm_data, this),
            'failure': function er(e) { console.error(e.error); }
        }});
    },

    template: Templates.charm,

    render: function () {
        console.log('render', this.get('charm'));
        var container = this.get('container');
        CharmCollectionView.superclass.render.apply(this, arguments);
        if (this.get('charm')) {
            var charm = this.get('charm');
            // Convert time stamp TODO: should be in db layer
            var last_modified = charm.last_change.created;
            if (last_modified)
                charm.last_change.created = new Date(last_modified * 1000);
            container.setHTML(this.template({'charm': charm}));

            container.one('#charm-deploy').on(
                'click', Y.bind(this.on_charm_deploy, this));
        } else {
            container.setHTML('<div class="alert">Loading...</div>');
        }
        return this;
    },

    on_charm_data: function (io_request) {
        charm = Y.JSON.parse(
            io_request.response.results[0].responseText);
        console.log('results update', charm, this);
        this.set('charm', charm);
        this.render();
    },

    on_charm_deploy: function(evt) {
        console.log('charm deploy', this.get('charm'));
        // this.fire('');
    }
});

CharmCollectionView = Y.Base.create('CharmCollectionView', Y.View, [], {

    initializer: function () {
        console.log("View: Initialized: Charm Collection", this.get('query'));
        this.set("charms", []);
        this.set('current_request', null);
        Y.one('#omnibar').on("submit", Y.bind(this.on_results_change, this));
        this.on_search_change();
    },

    template: Templates["charm-collection"],

    render: function () {
        var container = this.get('container'),
                 self = this;

        CharmCollectionView.superclass.render.apply(this, arguments);
        container.setHTML(this.template({'charms': this.get('charms')}));
        // TODO: Use view.events structure to attach this
        container.all('div.thumbnail').each(function( el ) {
            el.on("click", function(evt) {
                //console.log("Click", this.getData('charm-url'));
                self.fire("showCharm", {charm_data_url: this.getData('charm-url')});
            });
        });

        return this;
    },

    on_search_change: function(evt) {
        console.log('search update');
        if (evt) {
            evt.preventDefault();
            evt.stopImmediatePropagation();
        }

        var query = Y.one('#charm-search').get('value');
        if (!query) {
            query = this.get('query');
        } else {
            this.set('query');
        }

        // The handling in datasources-plugins is an example of doing this a bit better
        // ie. io cancellation outstanding requests, it does seem to cause some interference
        // with various datasource plugins though.
        charm_store.sendRequest({
            request: 'search/json?search_text=' + query,
            callback: {
                'success': Y.bind(this.on_results_change, this),
                'failure': function er(e) { console.error(e.error); }
        }});
    },

    on_results_change: function (io_request) {
        var result_set = Y.JSON.parse(
            io_request.response.results[0].responseText);
        console.log('results update', result_set, this);
        this.set('charms', result_set.results);
        this.render();
    }

});

views.charm_collection = CharmCollectionView;
views.charm = CharmView;

}, "0.1.0", {
    requires: [
        'node',
        'handlebars',
        'datasource-io',
        'datasource-jsonschema',
        'io-base',
        'json-parse',
        'gallery-markdown',
        'view']
});

