/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ButtonRow = require('./button-row');
const Button = require('../button/button');

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
    const wrapper = renderComponent({buttons});
    const expected = (
      <div className="button-row button-row--multiple button-row--count-1">
        <Button
          action={callbackStub}
          disabled={undefined}
          key="My button"
          submit={undefined}
          type="submit">
          My button
        </Button>
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
    const wrapper = renderComponent({buttons});
    const expected = (
      <div className="button-row button-row--multiple button-row--count-2">
        <Button
          action={callbackStub}
          disabled={undefined}
          key="My button"
          submit={undefined}
          type="submit">
          My button
        </Button>
        <Button
          action={callbackStub}
          disabled={undefined}
          key="Another button"
          submit={undefined}
          type="submit">
          Another button
        </Button>
      </div>);
    assert.compareJSX(wrapper, expected);
  });
});
