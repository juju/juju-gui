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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('EntityContent', function() {
  var mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-content', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('can display a charm', function() {
    var renderMarkdown = sinon.spy();
    var getFile = sinon.spy();
    var output = jsTestUtils.shallowRender(
        <juju.components.EntityContent
          entityModel={mockEntity}
          getFile={getFile}
          renderMarkdown={renderMarkdown} />);
    var option1 = {
      name: 'username',
      description: 'Your username',
      type: 'string',
      default: 'spinach'
    };
    var option2 = {
      name: 'password',
      description: 'Your password',
      type: 'string',
      default: 'abc123'
    };
    var expected = (
      <div className="row entity-content">
        <div className="inner-wrapper">
          <main className="seven-col append-one">
            <div className="entity-content__description">
              <h2>Description</h2>
              <p>Django framework.</p>
            </div>
            <juju.components.EntityContentReadme
              entityModel={mockEntity}
              renderMarkdown={renderMarkdown}
              getFile={getFile} />
            <div className="entity-content__configuration" id="configuration">
              <h3>Configuration</h3>
              <dl>
                <juju.components.EntityContentConfigOption
                  option={option1} />
                <juju.components.EntityContentConfigOption
                  option={option2} />
              </dl>
            </div>
          </main>
        </div>
      </div>);
    jsTestUtils.log(expected);
    jsTestUtils.log(output);
    assert.deepEqual(output, expected);
  });

  it('can display a bundle', function() {
    var renderMarkdown = sinon.spy();
    var getFile = sinon.spy();
    var mockEntity = jsTestUtils.makeEntity(true);
    var output = jsTestUtils.shallowRender(
        <juju.components.EntityContent
          entityModel={mockEntity}
          getFile={getFile}
          renderMarkdown={renderMarkdown} />);
    var expected = (
      <div className="row entity-content">
        <div className="inner-wrapper">
          <main className="seven-col append-one">
            {undefined}
            <juju.components.EntityContentReadme
              entityModel={mockEntity}
              renderMarkdown={renderMarkdown}
              getFile={getFile} />
            {undefined}
          </main>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });
});
