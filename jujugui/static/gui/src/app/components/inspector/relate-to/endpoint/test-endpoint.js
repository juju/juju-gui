/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const InspectorRelateToEndpoint = require('./endpoint');
const ButtonRow = require('../../../button-row/button-row');
const CheckListItem = require('../../../check-list-item/check-list-item');

describe('InspectorRelateToEndpoint', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <InspectorRelateToEndpoint
      backState={options.backState || {}}
      changeState={options.changeState || sinon.stub()}
      createRelation={options.createRelation || sinon.stub()}
      endpoints={options.endpoints || [[{
        service: '55173389$',
        name: 'db',
        type: 'mysql'
      }, {
        service: '59672078$',
        name: 'db',
        type: 'mysql'
      }]]} />
  );

  it('can render properly', () => {
    const wrapper = renderComponent();
    var expected = (
      <div className="inspector-relate-to-endpoint">
        <ul className="inspector-relate-to-endpoint__list">
          {[<CheckListItem
            key={0}
            label="db → db"
            ref="InspectorRelateToEndpoint-0"
            whenChanged={wrapper.find('CheckListItem').prop('whenChanged')} />]}
        </ul>
        <ButtonRow
          buttons={[{
            title: 'Relate',
            type: 'neutral',
            action: wrapper.find('ButtonRow').prop('buttons')[0].action,
            disabled: true
          }]} />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render when there are no relatable endpoints', () => {
    const wrapper = renderComponent({ endpoints: [] });
    assert.equal(
      wrapper.find('.inspector-relate-to-endpoint__message').text(),
      'No relatable endpoints for these applications.');
  });

  it('can handle creating a relation', () => {
    var changeState = sinon.stub();
    var createRelation = sinon.stub();
    var backState = {back: 'state'};
    const wrapper = renderComponent({
      backState,
      changeState,
      createRelation
    });
    const instance = wrapper.instance();
    // Trigger the checkbox for the available relation
    instance.refs = {
      'InspectorRelateToEndpoint-0': {
        state: { checked: true }}};
    wrapper.find('CheckListItem').props().whenChanged();
    // Click the add relation button
    wrapper.find('ButtonRow').prop('buttons')[0].action();
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
