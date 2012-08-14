YUI.add("juju-charm-store", function(Y) {
    
var ds = new Y.DataSource.IO({
    source: 'http://jujucharms.com:2464/search/json?search_text='
});
   
/*
ds.plug({
   fn: Y.PluginDataSourceJSONSchema, 
   cfg: {
       resultListLocator: 'results',
       
   }
});
*/

Y.namespace("juju").CharmStore = ds

}, "0.1.0", {
    requires: [
	"io",
	"datasource",
	"json-parse",
	]
});