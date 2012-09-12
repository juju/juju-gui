'use strict';

describe('utilities', function() {
    var Y, views;

    before(function (done) {
        Y = YUI(GlobalConfig).use(['juju-views'], function (Y) {
            views = Y.namespace('juju.views');
            done();
        });
    });

    it('must be able to display humanize time ago messages', function() {
        var now = Y.Lang.now();
        // Javascript timestamps are in milliseconds
        views.humanizeTimestamp(now).should.equal('less than a minute ago');
        views.humanizeTimestamp(now + 600000).should.equal('10 minutes ago');
        
      });

});