/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const ModalShortcuts = require('./modal-shortcuts');
const SvgIcon = require('../svg-icon/svg-icon');

describe('ModalSortcuts', function() {
  const renderComponent = (options = {}) =>
    enzyme.shallow(
      <ModalShortcuts.WrappedComponent
        closeModal={options.closeModal || sinon.stub()}
        guiVersion={options.guiVersion || '1.2.3'}
      />
    );

  beforeEach(function() {
    ModalShortcuts.__Rewire__('hotkeys', {
      keyBindings: {
        test: {label: 'test', help: 'a test item'},
        test2: {label: 'test2', help: 'a second test item'}
      }
    });
  });

  afterEach(function() {
    ModalShortcuts.__ResetDependency__('hotkeys');
  });

  it('renders', function() {
    const wrapper = renderComponent();
    let expected = (
      <div className="modal">
        <div className="twelve-col no-margin-bottom">
          <h2 className="bordered">Keyboard Shortcuts</h2>
          <span className="close" onClick={sinon.stub()} role="button" tabIndex="0">
            <SvgIcon name="close_16" size="16" />
          </span>
        </div>
        <div className="twelve-col">
          <div className="content">
            <div key="test">
              <div className="two-col">test</div>
              <div className="four-col last-col">a test item</div>
            </div>
            <div key="test2">
              <div className="two-col">test2</div>
              <div className="four-col last-col">a second test item</div>
            </div>
          </div>
        </div>
        <div className="twelve-col">
          <div className="content">Juju GUI version {'1.2.3'}</div>
        </div>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });
});
