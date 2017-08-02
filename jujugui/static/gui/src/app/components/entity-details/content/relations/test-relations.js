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

describe('EntityContentRelations', function() {
  var mockEntity;

  beforeAll(function(done) {
    // By loading these files it makes their classes available in the tests.
    YUI().use('entity-content-relations', function() { done(); });
  });

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('can render a list of relations', function() {
    var changeState = sinon.spy();
    var output = jsTestUtils.shallowRender(
      <juju.components.EntityContentRelations
        changeState={changeState}
        relations={mockEntity.get('relations')} />);
    var expected = (
      <div className="section entity-relations" id="relations">
        <h3 className="section__title">
          Relations
          <a href="https://jujucharms.com/docs/stable/charms-relations"
            target="_blank">
            <juju.components.SvgIcon name="help_16" size="16" />
          </a>
        </h3>
        <ul className="section__list" ref="list">
          <li className="link section__list-item"
            role="button"
            tabIndex="0"
            onClick={output.props.children[1].props.children[0].props.onClick}
            key="http">
            {'http'}: {'http'}
          </li>
          <li className="link section__list-item"
            role="button"
            tabIndex="0"
            onClick={output.props.children[1].props.children[1].props.onClick}
            key="cache">
            {'cache'}: {'cache'}
          </li>
        </ul>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('handles null relations with aplomb', function() {
    var provides = mockEntity.get('relations').provides;
    mockEntity.set('relations', {
      requires: null,
      provides: provides
    });
    var changeState = sinon.spy();
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityContentRelations
        changeState={changeState}
        relations={mockEntity.get('relations')} />);
    var expectedLength = Object.keys(provides).length;
    assert.equal(
      output.refs.list.getElementsByClassName('section__list-item').length,
      expectedLength);
  });

  it('can navigate to a relation', function() {
    var changeState = sinon.spy();
    var output = testUtils.renderIntoDocument(
      <juju.components.EntityContentRelations
        changeState={changeState}
        relations={mockEntity.get('relations')} />);
    var item = output.refs.list.getElementsByClassName('section__list-item')[0];
    testUtils.Simulate.click(item);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      search: {
        text: '',
        provides: 'http'
      },
      store: null
    });
  });

  it('can render a show more button when more than 2 relations are available',
    () => {
      const changeState = sinon.spy();
      let relations = mockEntity.get('relations');
      relations.provides['http2'] = {
        name: 'http2',
        interface: 'http2'
      };
      const renderer = jsTestUtils.shallowRender(
        <juju.components.EntityContentRelations
          changeState={changeState}
          relations={mockEntity.get('relations')} />, true);
      const output = renderer.getRenderOutput();
      const instance = renderer.getMountedInstance();
      const expected = (
        <div className="section entity-relations" id="relations">
          <h3 className="section__title">
            Relations
            <a href="https://jujucharms.com/docs/stable/charms-relations"
              target="_blank">
              <juju.components.SvgIcon name="help_16" size="16" />
            </a>
          </h3>
          <ul className="section__list" ref="list">
            <li className="link section__list-item"
              role="button"
              tabIndex="0"
              onClick={output.props.children[1].props.children[0].props.onClick}
              key="http">
              {'http'}: {'http'}
            </li>
            <li className="link section__list-item"
              role="button"
              tabIndex="0"
              onClick={output.props.children[1].props.children[1].props.onClick}
              key="http2">
              {'http2'}: {'http2'}
            </li>
            <li className="link section__list-item hidden"
              role="button"
              tabIndex="0"
              onClick={output.props.children[1].props.children[2].props.onClick}
              key="cache">
              {'cache'}: {'cache'}
            </li>
            <li className="section__list-item">
              <button className="button--inline-neutral"
                onClick={instance._handleViewMore.bind(instance)}
                role="button">View more relations</button>
            </li>
          </ul>
        </div>);
      expect(output).toEqualJSX(expected);
    }
  );

  it('can shows more and show a fewer button',
    () => {
      const changeState = sinon.spy();
      let relations = mockEntity.get('relations');
      relations.provides['http2'] = {
        name: 'http2',
        interface: 'http2'
      };
      const renderer = jsTestUtils.shallowRender(
        <juju.components.EntityContentRelations
          changeState={changeState}
          relations={mockEntity.get('relations')} />, true);
      const instance = renderer.getMountedInstance();
      instance._handleViewMore();
      const output = renderer.getRenderOutput();
      const expected = (
        <div className="section entity-relations" id="relations">
          <h3 className="section__title">
            Relations
            <a href="https://jujucharms.com/docs/stable/charms-relations"
              target="_blank">
              <juju.components.SvgIcon name="help_16" size="16" />
            </a>
          </h3>
          <ul className="section__list" ref="list">
            <li className="link section__list-item"
              role="button"
              tabIndex="0"
              onClick={output.props.children[1].props.children[0].props.onClick}
              key="http">
              {'http'}: {'http'}
            </li>
            <li className="link section__list-item"
              role="button"
              tabIndex="0"
              onClick={output.props.children[1].props.children[1].props.onClick}
              key="http2">
              {'http2'}: {'http2'}
            </li>
            <li className="link section__list-item"
              role="button"
              tabIndex="0"
              onClick={output.props.children[1].props.children[2].props.onClick}
              key="cache">
              {'cache'}: {'cache'}
            </li>
            <li className="section__list-item">
              <button className="button--inline-neutral"
                onClick={instance._handleRelationClick.bind(instance)}
                role="button">View fewer relations</button>
            </li>
          </ul>
        </div>);
      expect(output).toEqualJSX(expected);
    }
  );
});
