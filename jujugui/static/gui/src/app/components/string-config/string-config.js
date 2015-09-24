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

    getInitialState: function() {
      return { value: this.props.config };
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
      return (
        <div className="string-config">
        <span>{this.props.option.key} ({this.props.option.type})</span>
        <div
          className="string-config--value"
          contentEditable="true"
          onInput={this._updateValue}
          onBlur={this._updateValue}
          dangerouslySetInnerHTML={{__html: this.props.config}}>
        </div>
        <span className="string-config--description">
          {this.props.option.description}
        </span>
        </div>
      );
    }
  });

}, '0.1.0', { requires: [] });
