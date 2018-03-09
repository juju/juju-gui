/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorRelateToEndpoint = require('./endpoint');
const ButtonRow = require('../../../button-row/button-row');
const CheckListItem = require('../../../check-list-item/check-list-item');

const jsTestUtils = require('../../../../utils/component-test-utils');

describe('InspectorRelateToEndpoint', () => {

  it('can render properly', () => {
    var endpoints = [[{
      service: '55173389$',
      name: 'db',
      type: 'mysql'
    }, {
      service: '59672078$',
      name: 'db',
      type: 'mysql'
    }]];
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <InspectorRelateToEndpoint
        backState={{}}
        changeState={changeState}
        createRelation={sinon.stub()}
        endpoints={endpoints} />);
    var expected = (
      <div className="inspector-relate-to-endpoint">
        <ul className="inspector-relate-to-endpoint__list">
          {[<CheckListItem
            key={0}
            label="db → db"
            ref="InspectorRelateToEndpoint-0"
            whenChanged={output.props.children[0].props.children[0]
              .props.whenChanged} />]}
        </ul>
        <ButtonRow
          buttons={[{
            title: 'Relate',
            type: 'neutral',
            action: output.props.children[1].props.buttons[0].action,
            disabled: true
          }]} />
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render when there are no relatable endpoints', () => {
    var output = jsTestUtils.shallowRender(
      <InspectorRelateToEndpoint
        backState={{}}
        changeState={sinon.stub()}
        createRelation={sinon.stub()}
        endpoints={[]} />);
    var expected = (
      <div className="inspector-relate-to-endpoint">
        <ul className="inspector-relate-to-endpoint__list">
          <li className="inspector-relate-to-endpoint__message">
            No relatable endpoints for these applications.
          </li>
        </ul>
        {undefined}
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can handle creating a relation', () => {
    var endpoints = [[{
      service: '55173389$',
      name: 'db',
      type: 'mysql'
    }, {
      service: '59672078$',
      name: 'db',
      type: 'mysql'
    }]];
    var changeState = sinon.stub();
    var createRelation = sinon.stub();
    var backState = {back: 'state'};
    var renderer = jsTestUtils.shallowRender(
      <InspectorRelateToEndpoint
        backState={backState}
        changeState={changeState}
        createRelation={createRelation}
        endpoints={endpoints} />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    // Trigger the checkbox for the available relation
    instance.refs = {
      'InspectorRelateToEndpoint-0': {
        state: { checked: true }}};
    output.props.children[0].props.children[0].props.whenChanged();
    // Click the add relation button
    output.props.children[1].props.buttons[0].action();
    // Validate create relation.
    assert.equal(createRelation.callCount, 1);
    assert.deepEqual(createRelation.args[0][0], [[
      '55173389$', {
        name: 'db',
        role: 'client'
      }
    ], [
      '59672078$', {
        name: 'db',
        role: 'server'
      }
    ]]);
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], backState);
  });

});
