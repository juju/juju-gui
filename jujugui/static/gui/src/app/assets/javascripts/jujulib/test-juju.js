/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('juju.js', function() {

    it('exists', function() {
        var cs = new window.jujulib.charmstore();
        var env = new window.jujulib.environment();
        var identity = new window.jujulib.identity();
        assert.isTrue(cs instanceof window.jujulib.charmstore);
        assert.isTrue(env instanceof window.jujulib.environment);
        assert.isTrue(identity instanceof window.jujulib.identity);
    });
});
