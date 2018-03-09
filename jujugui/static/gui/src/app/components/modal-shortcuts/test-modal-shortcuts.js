/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ModalShortcuts = require('./modal-shortcuts');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');

describe('ModalSortcuts', function() {

  const keybindings = {
    test: {label: 'test', help: 'a test item'},
    test2: {label: 'test2', help: 'a second test item'}
  };

  it('renders', function() {
    const hide = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <ModalShortcuts.WrappedComponent
        closeModal={hide}
        guiVersion="1.2.3"
        keybindings={keybindings} />, true);
    let output = renderer.getRenderOutput();
    let expected = (<div className="modal">
      <div className="twelve-col no-margin-bottom">
        <h2 className="bordered">Keyboard Shortcuts</h2>
        <span className="close" onClick={hide} role="button"
          tabIndex="0">
          <SvgIcon name="close_16"
            size="16" />
        </span>
      </div>
      <div className="twelve-col">
        <div className="content">
          <div key="test">
            <div className="two-col">
              test
            </div>
            <div className="four-col last-col">
              a test item
            </div>
          </div>
          <div key="test2">
            <div className="two-col">
              test2
            </div>
            <div className="four-col last-col">
              a second test item
            </div>
          </div>
        </div>
      </div>
      <div className="twelve-col">
        <div className="content">
          Juju GUI version 1.2.3
        </div>
      </div>
    </div>);
    expect(output).toEqualJSX(expected);
  });
});
