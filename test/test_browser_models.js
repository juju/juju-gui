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

  describe('browser filter model', function() {
    var browser, Filter, models, Y;

    before(function(done) {
      Y = YUI(GlobalConfig).use([
        'juju-models', 'juju-browser-models'], function(Y) {
        models = Y.namespace('juju.models');
        browser = models.browser;
        Filter = browser.Filter;
        done();
      });
    });

    // Ensure the search results are rendered inside the container.
    it('defaults to an initial filter set', function() {
      var filter = new Filter();
      filter.get('series').should.eql(['precise']);
      filter.get('type').should.eql(['approved']);
    });

    it('constructs a valid query string based on settings.', function() {
      var filter = new Filter();
      filter.genQueryString().should.equal(
          'series=precise&text=&type=approved');

      filter.set('series', []);
      // Google and Firefox think that the string should start with the first
      // param. PhantomJS thinks it starts with a &. Removing the & if it's at
      // the start of the string and checking the rest of it for validity.
      var qstring = filter.genQueryString();
      if (qstring.charAt(0) === '&') {
        qstring = qstring.slice(1);
      }

      qstring.should.equal('text=&type=approved');
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
