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

describe('EntityContentRevisions', function() {
  var mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-content-revisions', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('can render a list of revisions', function() {
    var output = jsTestUtils.shallowRender(
      <juju.components.EntityContentRevisions
        revisions={mockEntity.get('revisions')} />);
    var buttons = output.props.children[1].props.children[1].props.children;
    var expected = (
      <div className="revisions section" id="revisions">
        <h3 className="section__title">{3} Revisions</h3>
        <ol className="revisions__list list--concealed" ref="list" reversed>
          {[
            <li className="revisions__list-item list-item" key={40}>
              <p className="revisions__list-meta smaller">
                by {"Charles Butler"}
                <span className="revisions__list-meta-date">
                  <juju.components.DateDisplay
                    date="2015-06-16T17:09:35Z"
                    relative={true} />
                </span>
              </p>
              <p className="revisions__list-message">
                Fix the django 1.8 with postgresql test.
              </p>
            </li>,
            <li className="revisions__list-item list-item" key={39}>
              <p className="revisions__list-meta smaller">
                by {"Tim Van Steenburgh"}
                <span className="revisions__list-meta-date">
                  <juju.components.DateDisplay
                    date="2015-06-12T14:02:06Z"
                    relative={true} />
                </span>
              </p>
              <p className="revisions__list-message">
                Remove charmhelpers.contrib (not used)
              </p>
            </li>,
            <li className="revisions__list-item list-item" key={38}>
              <p className="revisions__list-meta smaller">
                by {"Charles Butler"}
                <span className="revisions__list-meta-date">
                  <juju.components.DateDisplay
                    date="2015-05-22T19:35:18Z"
                    relative={true} />
                </span>
              </p>
              <p className="revisions__list-message">
                Run migrate if django is modern enough.
              </p>
            </li>
          ]}
          <li className="list__controls">
            <a href="" className="btn__see--more"
              onClick={buttons[0].props.onClick}>See more</a>
            <a href="#revisions" className="btn__see--less"
              onClick={buttons[1].props.onClick}>See less</a>
          </li>
        </ol>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can reveal and hide relation list', function() {
    var changeState = sinon.spy();
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityContentRevisions
        changeState={changeState}
        revisions={mockEntity.get('revisions')} />);
    var more = ReactDOM.findDOMNode(output).querySelector('.btn__see--more');
    var less = ReactDOM.findDOMNode(output).querySelector('.btn__see--less');
    testUtils.Simulate.click(more);
    assert.equal(output.state.showMore, true);
    testUtils.Simulate.click(less);
    assert.equal(output.state.showMore, false);
  });
});
