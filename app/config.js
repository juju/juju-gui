YUI.add("juju-config", function(Y) {

/*
 * Configuration for Juju GUI
 * 
 * Most of these values are documented in YUI.App's documentation. 
 * Specfically we add URLs for various endpoints used by the application.
 * 
 * The most important of these is socket_url which must point to the 
 * websocket endpoint of the Juju API server.
 * 
 */            
var default_config = {
    serverRouting: false,
    html5: true,
    contain : "#main",
    viewContainer: "#main",
    transitions: true,
   
    socket_url: "ws://localhost:8081/ws",
    charm_store_url: "http://jujucharms.com/",
    charm_search_url: "http://jujucharms.com/"
};

Y.namespace("juju").config = default_config;
}, "0.1.0", {});
