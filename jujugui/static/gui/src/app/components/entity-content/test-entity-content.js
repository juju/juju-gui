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

function _generateTagItem(tag, fn) {
  return [
    <li key={tag}>
      <a data-id={tag} onClick={fn}>{tag}</a>
    </li>
  ];
}

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
    var apiUrl = 'http://example.com';
    var renderMarkdown = sinon.spy();
    var getFile = sinon.spy();
    var changeState = sinon.spy();
    var pluralize = sinon.spy();
    var renderer = jsTestUtils.shallowRender(
        <juju.components.EntityContent
          apiUrl={apiUrl}
          changeState={changeState}
          entityModel={mockEntity}
          getFile={getFile}
          pluralize={pluralize}
          renderMarkdown={renderMarkdown} />, true);
    var option1 = {
      description: 'Your username',
      type: 'string',
      default: 'spinach',
      name: 'username'
    };
    var option2 = {
      description: 'Your password',
      type: 'string',
      default: 'abc123',
      name: 'password'
    };
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="entity-content">
        <div className="row entity-content__description">
          <div className="inner-wrapper">
            <div className="twelve-col">
              <p>Django framework.</p>
            </div>
            <div className="four-col entity-content__metadata">
              <h4>Tags</h4>
              <ul>
                {_generateTagItem('database', instance._handleTagClick)}
              </ul>
            </div>
            <div className="four-col entity-content__metadata last-col">
              <h4>More information</h4>
              <ul>
                <li>
                  <a
                    href="https://bugs.launchpad.net/charms/+source/django"
                    target="_blank">
                    Bugs
                  </a>
                </li>
                <li>
                  <a href={'https://bugs.launchpad.net/charms/+source/' +
                    'django/+filebug'} target="_blank">
                    Submit a bug
                  </a>
                </li>
                <li>
                  <a href={'https://code.launchpad.net/~charmers/charms/' +
                    'trusty/django/trunk'} target="_blank">
                    Contribute
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="inner-wrapper">
            <div className="seven-col append-one">
              <juju.components.EntityContentReadme
                entityModel={mockEntity}
                renderMarkdown={renderMarkdown}
                getFile={getFile} />
            </div>
            <div className="four-col">
              <juju.components.EntityContentRelations
                changeState={changeState}
                relations={mockEntity.get('relations')} />
            </div>
            <div className="four-col">
              <juju.components.EntityFiles
                apiUrl={apiUrl}
                entityModel={mockEntity}
                pluralize={pluralize} />
            </div>
            <div className="four-col">
              <juju.components.EntityContentRevisions
                revisions={mockEntity.get('revisions')} />
            </div>
          </div>
        </div>
        <div id="configuration" className="row entity-content__configuration">
          <div className="inner-wrapper">
            <div className="twelve-col">
              <h2 className="entity-content__header">Configuration</h2>
              <dl>
                <juju.components.EntityContentConfigOption
                  key={option1.name}
                  option={option1} />
                <juju.components.EntityContentConfigOption
                  key={option2.name}
                  option={option2} />
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can display a charm with no options', function() {
    mockEntity.set('options', null);
    var apiUrl = 'http://example.com';
    var renderMarkdown = sinon.spy();
    var getFile = sinon.spy();
    var pluralize = sinon.spy();
    var changeState = sinon.spy();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.EntityContent
        apiUrl={apiUrl}
        changeState={changeState}
        entityModel={mockEntity}
        getFile={getFile}
        pluralize={pluralize}
        renderMarkdown={renderMarkdown} />, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <div className="entity-content">
        <div className="row entity-content__description">
          <div className="inner-wrapper">
            <div className="twelve-col">
              <p>Django framework.</p>
            </div>
            <div className="four-col entity-content__metadata">
              <h4>Tags</h4>
              <ul>
                {_generateTagItem('database', instance._handleTagClick)}
              </ul>
            </div>
            <div className="four-col entity-content__metadata last-col">
              <h4>More information</h4>
              <ul>
                <li>
                  <a
                    href="https://bugs.launchpad.net/charms/+source/django"
                    target="_blank">
                    Bugs
                  </a>
                </li>
                <li>
                  <a href={'https://bugs.launchpad.net/charms/+source/' +
                    'django/+filebug'} target="_blank">
                    Submit a bug
                  </a>
                </li>
                <li>
                  <a href={'https://code.launchpad.net/~charmers/charms/' +
                    'trusty/django/trunk'} target="_blank">
                    Contribute
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="inner-wrapper">
            <div className="seven-col append-one">
              <juju.components.EntityContentReadme
                entityModel={mockEntity}
                renderMarkdown={renderMarkdown}
                getFile={getFile} />
            </div>
            <div className="four-col">
              <juju.components.EntityContentRelations
                changeState={changeState}
                relations={mockEntity.get('relations')} />
            </div>
            <div className="four-col">
              <juju.components.EntityFiles
                apiUrl={apiUrl}
                entityModel={mockEntity}
                pluralize={pluralize} />
            </div>
            <div className="four-col">
              <juju.components.EntityContentRevisions
                revisions={mockEntity.get('revisions')} />
            </div>
          </div>
        </div>
        {undefined}
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can display a bundle', function() {
    var apiUrl = 'http://example.com';
    var renderMarkdown = sinon.spy();
    var getFile = sinon.spy();
    var changeState = sinon.spy();
    var pluralize = sinon.spy();
    var mockEntity = jsTestUtils.makeEntity(true);
    var output = jsTestUtils.shallowRender(
        <juju.components.EntityContent
          apiUrl={apiUrl}
          changeState={changeState}
          entityModel={mockEntity}
          getFile={getFile}
          pluralize={pluralize}
          renderMarkdown={renderMarkdown} />);
    var expected = (
      <div className="entity-content">
        {undefined}
        <div className="row">
          <div className="inner-wrapper">
            <div className="seven-col append-one">
              <juju.components.EntityContentReadme
                entityModel={mockEntity}
                renderMarkdown={renderMarkdown}
                getFile={getFile} />
            </div>
            {undefined}
            <div className="four-col">
              <juju.components.EntityFiles
                apiUrl={apiUrl}
                entityModel={mockEntity}
                pluralize={pluralize} />
            </div>
            {undefined}
          </div>
        </div>
        {undefined}
      </div>
    );
    assert.deepEqual(output, expected);
  });
});
