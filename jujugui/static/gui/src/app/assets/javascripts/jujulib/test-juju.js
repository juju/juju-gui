/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('juju.js', function() {

    it('exists', function() {
        var cs = new jujulib.charmstore();
        var env = new jujulib.environment();
        var identity = new jujulib.identity();
        assert.isTrue(cs instanceof jujulib.charmstore);
        assert.isTrue(env instanceof jujulib.environment);
        assert.isTrue(identity instanceof jujulib.identity);
    });
});
