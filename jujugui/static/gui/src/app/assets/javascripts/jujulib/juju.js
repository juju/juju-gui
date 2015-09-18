/*
Copyright (C) 2015 Canonical Ltd.

XXX jcssackett 2015-09-18: Licensing for juju.js? It's different then the
licensing for the GUI.
*/

;

var jujulib = (function (exports) {

    var juju = {
        charmstore: function() {},
        environment: function() {},
        identity: function() {}
    };

    return juju;

})(typeof exports === 'undefined'? this.jujulib={}: exports);
