/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ButtonRow = require('./button-row');
const GenericButton = require('../generic-button/generic-button');

describe('ButtonRow', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <ButtonRow
      buttons={options.buttons || []} />
  );

  it('generates a button', function() {
    var callbackStub = sinon.stub();
    var buttons = [{
      title: 'My button',
      type: 'submit',
      action: callbackStub
    }];
    const wrapper = renderComponent({ buttons });
    const expected = (
      <div className="button-row button-row--multiple button-row--count-1">
        <GenericButton
          action={callbackStub}
          disabled={undefined}
          key="My button"
          submit={undefined}
          type="submit">
          My button
        </GenericButton>
      </div>
    );
    assert.compareJSX(wrapper, expected);
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
    const wrapper = renderComponent({ buttons });
    const expected = (
      <div className="button-row button-row--multiple button-row--count-2">
        <GenericButton
          action={callbackStub}
          disabled={undefined}
          key="My button"
          submit={undefined}
          type="submit">
          My button
        </GenericButton>
        <GenericButton
          action={callbackStub}
          disabled={undefined}
          key="Another button"
          submit={undefined}
          type="submit">
          Another button
        </GenericButton>
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});
