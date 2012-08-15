YUI.add("juju-charm-store", function(Y) {
    
var ds = new Y.DataSource.IO({
    source: 'http://jujucharms.com:2464/search/json?search_text='
});
   

ds.plug({
    fn: Y.PluginDataSourceJSONSchema,
    cfg: {schema: {resultListLocator: "results"}}
});

ds.plug({
    fn: Y.DataSourceCache,
    cfg: { max:3}
});

Y.namespace("juju").CharmStore = ds

}, "0.1.0", {
    requires: [
	"io",
	"datasource-io",
	"datasource-jsonschema",
	"datasource-cache",
//	"json-parse",
	]
});