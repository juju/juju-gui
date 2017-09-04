/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const InspectorConfirm = require('./confirm');
const ButtonRow = require('../../button-row/button-row');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('InspectorConfirm', function() {
  let buttons;

  beforeEach(function() {
    buttons = [
      {
        disabled: false,
        title: 'Test 1',
        action: () => {}
      },
      {
        disabled: false,
        title: 'Test 2',
        action: () => {}
      }
    ];
  });

  it('generates the correct classes if it is closed', function() {
    const output = jsTestUtils.shallowRender(
      <InspectorConfirm
        buttons={buttons}
        message="My message" />);
    assert.deepEqual(output,
      <div className="inspector-confirm">
        <p className="inspector-confirm__message">
          My message
        </p>
        <ButtonRow
          buttons={buttons} />
      </div>);
  });

  it('generates the correct classes if it is open', function() {
    const output = jsTestUtils.shallowRender(
      <InspectorConfirm
        buttons={buttons}
        message="My message"
        open={true} />);
    assert.deepEqual(output,
      <div className="inspector-confirm inspector-confirm--open">
        <p className="inspector-confirm__message">
          My message
        </p>
        <ButtonRow
          buttons={buttons} />
      </div>);
  });

  it('displays the provided message', function() {
    const output = jsTestUtils.shallowRender(
      <InspectorConfirm
        buttons={buttons}
        message="My message" />);
    assert.deepEqual(output.props.children[0],
      <p className="inspector-confirm__message">
        My message
      </p>);
  });

  it('hides the message if one is not provided', function() {
    const output = jsTestUtils.shallowRender(
      <InspectorConfirm
        buttons={buttons} />);
    assert.deepEqual(output.props.children[0],
      <p className="inspector-confirm__message hidden">
        {undefined}
      </p>);
  });

  it('leaves out the button row if there are no buttons', function() {
    buttons = [];
    const output = jsTestUtils.shallowRender(
      <InspectorConfirm
        buttons={buttons} />);
    assert.deepEqual(output.props.children[1], undefined);
  });
});
