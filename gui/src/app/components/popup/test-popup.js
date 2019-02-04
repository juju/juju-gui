/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Popup = require('./popup');
const {ButtonRow} = require('@canonical/juju-react-components');
const {Button} = require('@canonical/juju-react-components');
const {SvgIcon} = require('@canonical/juju-react-components');

describe('Popup', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <Popup
      buttons={options.buttons || ['one', 'two']}
      close={options.close || sinon.stub()}
      title={options.title || 'A title'}
      type={options.type}>
      {options.children || (<span>Content</span>)}
    </Popup>
  );

  it('can render', () => {
    const wrapper = renderComponent();
    const expected = (
      <div className="popup__panel popup__panel--narrow">
        <div className="popup__close v1">
          <Button
            action={sinon.stub()}
            extraClasses="is-inline"
            modifier="base">
            <SvgIcon
              name="close_16"
              size="16" />
          </Button>
        </div>
        <h3 className="popup__title">
          A title
        </h3>
        <span>Content</span>
        <span className="v1">
          <ButtonRow
            buttons={['one', 'two']} />
        </span>
      </div>
    );
    assert.compareJSX(wrapper.find('.popup__panel'), expected);
  });

  it('can set a type class', () => {
    const wrapper = renderComponent({type: 'wide'});
    assert.equal(
      wrapper.find('.popup__panel').prop('className').includes('popup__panel--wide'),
      true);
  });
});
