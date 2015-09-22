;
/*
Copyright (C) 2015 Canonical Ltd.

XXX jcssackett 2015-09-18: Licensing for juju.js? It's different then the
licensing for the GUI.
*/

'use strict';

var module = module;

(function (exports) {

    var jujulib = {
        charmstore: function() {},
        environment: function() {},
        identity: function() {}
    };

    exports.jujulib = jujulib;

}((module && module.exports) ? module.exports : this));
