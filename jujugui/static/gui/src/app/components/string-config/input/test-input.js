'use strict';

const React = require('react');
const enzyme = require('enzyme');

const StringConfigInput = require('./input');

describe('StringConfigInput', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <StringConfigInput
      config={options.config || 'config value'}
      disabled={options.disabled === undefined ? false : options.disabled}
      setValue={options.setValue || sinon.stub()} />
  );

  it('can render', function() {
    const wrapper = renderComponent();
    var expected = (
      <div className="string-config-input"
        contentEditable={true}
        dangerouslySetInnerHTML={{__html: 'config value'}}
        onBlur={wrapper.prop('onBlur')}
        onInput={wrapper.prop('onInput')}
        ref="editableInput">
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can update the value', function() {
    const setValue = sinon.stub();
    const wrapper = renderComponent({ setValue });
    const instance = wrapper.instance();
    instance.refs = {
      editableInput: {
        innerText: 'new value'
      }
    };
    wrapper.simulate('input', {
      currentTarget: {
        innerText: 'new value'
      }
    });
    assert.equal(setValue.callCount, 1);
    assert.equal(setValue.args[0][0], 'new value');
  });

  it('does not update if the values are the same', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = {
      editableInput: {
        innerText: 'new value'
      }
    };
    wrapper.simulate('input', {
      currentTarget: {
        innerText: 'new value'
      }
    });
    wrapper.update();
    assert.equal(wrapper.prop('dangerouslySetInnerHTML').__html, 'config value');
  });

  it('updates if the values are the different', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = {
      editableInput: {
        innerText: 'new value'
      }
    };
    wrapper.simulate('input', {
      currentTarget: {
        innerText: 'another value'
      }
    });
    wrapper.update();
    assert.equal(wrapper.prop('dangerouslySetInnerHTML').__html, 'another value');
  });
});
