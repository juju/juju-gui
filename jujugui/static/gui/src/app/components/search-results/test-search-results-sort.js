/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('SearchResultsSort', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('search-results-sort', function() { done(); });
  });

  it('can render a sort control', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsSort
        changeState={changeState}
        currentSort={null} />);
    assert.deepEqual(output,
      <div className="list-block__sort">
        Sort by:
        <select onChange={output.props.children[1].props.onChange}
          defaultValue={null}>
            <option value="" key="">Default</option>
            <option value="-downloads" key="-downloads">Most popular</option>
            <option value="downloads" key="downloads">Least popular</option>
            <option value="name" key="name">Name (a-z)</option>
            <option value="-name" key="-name">Name (z-a)</option>
            <option value="owner" key="owner">Author (a-z)</option>
            <option value="-owner" key="-owner">Author (z-a)</option>
        </select>
      </div>);
  });

  it('select a sort option', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsSort
        changeState={changeState}
        currentSort="-name" />);
    assert.deepEqual(output,
      <div className="list-block__sort">
        Sort by:
        <select onChange={output.props.children[1].props.onChange}
          defaultValue="-name">
            <option value="" key="">Default</option>
            <option value="-downloads" key="-downloads">Most popular</option>
            <option value="downloads" key="downloads">Least popular</option>
            <option value="name" key="name">Name (a-z)</option>
            <option value="-name" key="-name">Name (z-a)</option>
            <option value="owner" key="owner">Author (a-z)</option>
            <option value="-owner" key="-owner">Author (z-a)</option>
        </select>
      </div>);
  });

  it('can change the search state', function() {
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.SearchResultsSort
        changeState={changeState}
        currentSort={null} />);
    output.props.children[1].props.onChange({
      currentTarget: {
        value: 'owner'
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'charmbrowser',
        metadata: {
          activeComponent: 'search-results',
          sort: 'owner'
        }
      }
    });
  });
});
