/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ButtonRow = require('./button-row');
const GenericButton = require('../generic-button/generic-button');

const jsTestUtils = require('../../utils/component-test-utils');

describe('ButtonRow', function() {

  it('generates a button', function() {
    var callbackStub = sinon.stub();
    var buttons = [{
      title: 'My button',
      type: 'submit',
      action: callbackStub
    }];
    var output = jsTestUtils.shallowRender(
      <ButtonRow
        buttons={buttons} />);
    assert.deepEqual(output.props.children, [
      <GenericButton
        key="My button"
        action={callbackStub}
        disabled={undefined}
        submit={undefined}
        type="submit">
        My button
      </GenericButton>]);
  });

  it('sets a class when generating multiple buttons', function() {
    var callbackStub = sinon.stub();
    var buttons = [{
      title: 'My button',
      type: 'submit',
      action: callbackStub
    }, {
      title: 'Another button',
      type: 'submit',
      action: callbackStub
    }];
    var output = jsTestUtils.shallowRender(
      <ButtonRow
        buttons={buttons} />);
    var children = [
      <GenericButton
        key="My button"
        action={callbackStub}
        disabled={undefined}
        submit={undefined}
        type="submit">
        My button
      </GenericButton>,
      <GenericButton
        key="Another button"
        action={callbackStub}
        disabled={undefined}
        submit={undefined}
        type="submit">
        Another button
      </GenericButton>
    ];
    assert.deepEqual(output,
      <div className="button-row button-row--multiple button-row--count-2">
        {children}
      </div>);
  });
});
