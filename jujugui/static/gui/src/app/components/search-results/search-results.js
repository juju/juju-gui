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

YUI.add('search-results', function(Y) {

  juju.components.SearchResults = React.createClass({
    search: function() {
      /*
       * XXX: replace this placeholder and its dummy data with live call to
       * search service.
       */
      return {
        hasResults: true,
        solutionsCount: 5,
        nameWidth: 'foobar',
        text: this.props.query,
        currentType: 'all',
        currentSeries: 'trusty',
        allSeries: ['all', 'precise', 'trusty', 'centos7'],
        currentTopics: [],
        promulgatedResultsCount: 2,
        promulgatedResults: [
          {
            type: 'charm',
            docType: 'charm',
            name: 'mysql',
            displayName: 'MySQL',
            url: 'http://example.com/mysql',
            tags: ['database', 'sql'],
            series: [
              {name: 'trusty', url: 'http://example.com/trusty-mysql'},
              {name: 'precise', url: 'http://example.com/precise-mysql'}
            ],
            downloads: 30,
            owner: 'test-owner-1'
          },
          {
            type: 'charm',
            docType: 'charm',
            name: 'wordpress',
            displayName: 'Wordpress',
            url: 'http://example.com/wordpress',
            tags: [],
            series: [
              {name: 'trusty', url: 'http://example.com/trusty-wordpress'},
              {name: 'precise', url: 'http://example.com/precise-wordpress'}
            ],
            downloads: 300,
            owner: 'test-owner-2'
          },
        ],
        STATIC_URL: 'STATIC/',
        resultsCount: 3,
        results: [
          {
            type: 'charm',
            docType: 'charm',
            name: 'mysql',
            displayName: 'MySQL',
            url: 'http://example.com/mysql',
            tags: ['database', 'sql'],
            series: [
              {name: 'trusty', url: 'http://example.com/trusty-mysql'},
              {name: 'precise', url: 'http://example.com/precise-mysql'}
            ],
            downloads: 30,
            owner: 'test-owner-1'
          },
          {
            type: 'charm',
            docType: 'charm',
            name: 'wordpress',
            displayName: 'Wordpress',
            url: 'http://example.com/wordpress',
            tags: [],
            series: [
              {name: 'trusty', url: 'http://example.com/trusty-wordpress'},
              {name: 'precise', url: 'http://example.com/precise-wordpress'}
            ],
            downloads: 300,
            owner: 'test-owner-2'
          },
          {
            type: 'charm',
            docType: 'charm',
            name: 'ghost',
            displayName: 'Ghost',
            url: 'http://example.com/ghost',
            tags: ['cms'],
            series: [],
            downloads: 3,
            owner: 'test-owner-3'
          },
        ]
      };
    },

    render: function() {
      var classes = 'search-results';
      var html = Handlebars.templates['search-results.hbs'](this.search());
      return (
        <div className={classes}
          dangerouslySetInnerHTML={{__html: html}}>
        </div>
      );
    }
  });

}, '0.1.0', {requires: []});
