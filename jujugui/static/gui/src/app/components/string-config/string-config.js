/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

YUI.add('string-config', function() {

  juju.components.StringConfig = React.createClass({

    propTypes: {
      config: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
      ]),
      disabled: React.PropTypes.bool,
      option: React.PropTypes.object.isRequired
    },

    getDefaultProps: () => {
      return {
        disabled: false
      };
    },

    getInitialState: function() {
      return { value: this.props.config };
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState({ value: nextProps.config });
    },

    shouldComponentUpdate: function(nextProps, nextState) {
      return nextState.value !== this.refs.editableInput.innerText;
    },

    /**
      When the value is updated in the input element then update the state
      with its innerText.

      @method _updateValue
      @param {Object} e The input or blur event objects.
    */
    _updateValue: function(e) {
      this.setState({ value: e.currentTarget.innerText });
    },

    render: function() {
      var disabled = this.props.disabled;
      var type = this.props.option.type;
      var typeString = type ? ` (${type})` : '';
      var classes = classNames(
        'string-config--value',
        {'string-config--disabled': disabled});
      return (
        <div className="string-config">
          <span>{this.props.option.key}{typeString}</span>
          <div
            className={classes}
            contentEditable={!disabled}
            ref="editableInput"
            onInput={this._updateValue}
            onBlur={this._updateValue}
            dangerouslySetInnerHTML={{__html: this.state.value}}>
          </div>
          <span className="string-config--description"
            dangerouslySetInnerHTML={{__html: this.props.option.description}}>
          </span>
        </div>
      );
    }
  });

}, '0.1.0', { requires: [] });
