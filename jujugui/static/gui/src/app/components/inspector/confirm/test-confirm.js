/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const InspectorConfirm = require('./confirm');
const ButtonRow = require('../../shared/button-row/button-row');

describe('InspectorConfirm', function() {
  let buttons;

  const renderComponent = (options = {}) => enzyme.shallow(
    <InspectorConfirm
      buttons={options.buttons || buttons}
      message={options.message === undefined ? 'My message' : options.message}
      open={options.open} />
  );

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
    const wrapper = renderComponent();
    const expected = (
      <div className="inspector-confirm">
        <p className="inspector-confirm__message">
          My message
        </p>
        <ButtonRow
          buttons={buttons} />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('generates the correct classes if it is open', function() {
    const wrapper = renderComponent({ open: true });
    assert.equal(
      wrapper.prop('className').includes('inspector-confirm--open'),
      true);
  });

  it('hides the message if one is not provided', function() {
    const wrapper = renderComponent({ message: null });
    const expected = (
      <p className="inspector-confirm__message hidden">
        {undefined}
      </p>);
    assert.compareJSX(wrapper.find('.inspector-confirm__message'), expected);
  });

  it('leaves out the button row if there are no buttons', function() {
    buttons = [];
    const wrapper = renderComponent();
    assert.equal(wrapper.find('ButtonRow').length, 0);
  });
});
