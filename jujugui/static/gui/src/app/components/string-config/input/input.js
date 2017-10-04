/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class StringConfigInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.config
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.value !== this.refs.editableInput.innerText;
  }

  /**
    When the value is updated in the input element then update the state
    with its innerText.

    @param {Object} evt The input or blur event objects.
  */
  _updateValue(evt) {
    const value = evt.currentTarget.innerText;
    this.props.setValue(value);
    this.setState({value:  value});
  }

  render() {
    return (
      <div className="string-config-input"
        contentEditable={!this.props.disabled}
        dangerouslySetInnerHTML={{__html: this.state.value}}
        onBlur={this._updateValue.bind(this)}
        onInput={this._updateValue.bind(this)}
        ref="editableInput">
      </div>
    );
  }
};

StringConfigInput.propTypes = {
  config: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  disabled: PropTypes.bool,
  setValue: PropTypes.func.isRequired
};

module.exports = StringConfigInput;
