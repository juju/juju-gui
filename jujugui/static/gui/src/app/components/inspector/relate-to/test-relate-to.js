/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorRelateTo = require('./relate-to');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('InspectorRelateTo', function() {

  it('can render properly', () => {
    var applications = [{
      getAttrs: () => ({ id: 'id', name: 'name', icon: 'icon'})
    }];
    var output = jsTestUtils.shallowRender(
      <InspectorRelateTo
        application={{}}
        changeState={sinon.stub()}
        relatableApplications={applications} />);
    var expected = (
      <div className="inspector-relate-to">
        <ul className="inspector-view__list">
          {[<li className="inspector-view__list-item"
            data-id="id"
            key="id0"
            onClick={output.props.children.props.children[0].props.onClick}
            role="button"
            tabIndex="0">
            <img className="inspector-view__item-icon" src="icon" />
              name
          </li>]}
        </ul>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can render when there are no relatable endpoints', () => {
    var output = jsTestUtils.shallowRender(
      <InspectorRelateTo
        application={{}}
        changeState={sinon.stub()}
        relatableApplications={[]} />);
    var expected = (
      <div className="inspector-relate-to">
        <ul className="inspector-view__list">
          <div className="unit-list__message">
            No relatable endpoints available.
          </div>
        </ul>
      </div>
    );
    assert.deepEqual(output, expected);
  });

  it('can navigate to relate-to-endpoint', () => {
    var applications = [{
      getAttrs: () => ({ id: 'id', name: 'name', icon: 'icon'})
    }];
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <InspectorRelateTo
        application={{
          get: () => 'my-id'
        }}
        changeState={changeState}
        relatableApplications={applications} />);
    // Trigger a relation click.
    output.props.children.props.children[0].props.onClick({
      currentTarget: {
        getAttribute: sinon.stub().withArgs('data-id').returns('zee-spouse')
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'my-id',
          'relate-to': 'zee-spouse',
          activeComponent: 'relate-to'
        }}});

  });

});
