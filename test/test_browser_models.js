/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

(function() {

  describe('browser model utils', function() {
    var helperNS, ns, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-models', 'juju-browser-models'], function(Y) {

        helperNS = Y.namespace('Handlebars.helpers');
        ns = Y.namespace('juju.models.browser');
        done();
      });
    });

    afterEach(function() {
      if (helperNS.prettyProvider) {
        helperNS.prettyProvider = undefined;
      }
    });

    it('provides a provider template helper', function() {
      ns.registerHelpers();
      assert.equal(typeof helperNS.prettyProvider, 'function');

      var tplString = '{{prettyProvider provider}}',
          template = Y.Handlebars.compile(tplString);

      assert.equal(template({provider: 'openstack'}), 'HP Cloud');
    });

    it('handles mapping from test names to filter names', function() {
      ns.registerHelpers();
      var tplString = '{{prettyProvider provider}}',
          template = Y.Handlebars.compile(tplString);

      assert.equal(template({provider: 'local'}), 'LXC');
      assert.equal(template({provider: 'ec2'}), 'AWS/EC2');
    });


  });

  describe('browser filter model', function() {
    var Filter, models, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-models', 'juju-browser-models', 'juju-app-state'], function(Y) {
        models = Y.namespace('juju.models');
        Filter = models.Filter;
        done();
      });
    });

    it('can reset to its initial defaults', function() {
      var filter = new Filter();
      filter.set('text', 'foo');
      filter.set('provider', ['ec2']);
      filter.clear();
      assert.equal(0, filter.get('provider').length);
      assert.equal('', filter.get('text'));
    });

    it('constructs a valid query string based on settings.', function() {
      var filter = new Filter();
      filter.set('text', 'foo');

      // Google and Firefox think that the string should start with the first
      // param. PhantomJS thinks it starts with a &. Removing the & if it's at
      // the start of the string and checking the rest of it for validity.
      var qstring = filter.genQueryString();
      if (qstring.charAt(0) === '&') {
        qstring = qstring.slice(1);
      }

      qstring.should.equal('text=foo');
    });

    it('updates string values into an array', function() {
      var filter = new Filter({
        text: 'one'
      });

      filter.update({categories: 'databases'});
      filter.get('categories').should.eql(['databases']);
      // While the text is left along
      filter.get('text').should.eql('one');
    });

    it('updates text when empty', function() {
      var filter = new Filter({
        text: 'one'
      });

      filter.get('text').should.eql('one');
      filter.update({text: ''});
      filter.get('text').should.equal('');
    });
  });

})();
