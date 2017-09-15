/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Popup = require('./popup');
const ButtonRow = require('../button-row/button-row');
const GenericButton = require('../generic-button/generic-button');
const Panel = require('../panel/panel');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Popup', () => {

  it('can render', () => {
    const buttons = ['one', 'two'];
    const close = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <Popup
        buttons={buttons}
        close={close}
        title="A title">
        <span>Content</span>
      </Popup>);
    const expected = (
      <Panel
        instanceName="popup"
        visible={true}>
        <div className="popup__panel popup__panel--narrow">
          <div className="popup__close">
            <GenericButton
              action={close}
              type="base">
              <SvgIcon
                name="close_16"
                size="16" />
            </GenericButton>
          </div>
          <h3 className="popup__title">
            A title
          </h3>
          <span>Content</span>
          <ButtonRow
            buttons={buttons} />
        </div>
      </Panel>
    );
    assert.deepEqual(output, expected);
  });

  it('can set a type class', () => {
    const output = jsTestUtils.shallowRender(
      <Popup
        type="wide">
        <span>Content</span>
      </Popup>);
    const expected = (
      <Panel
        instanceName="popup"
        visible={true}>
        <div className="popup__panel popup__panel--wide">
          {undefined}
          {undefined}
          <span>Content</span>
          {undefined}
        </div>
      </Panel>
    );
    assert.deepEqual(output, expected);
  });
});
