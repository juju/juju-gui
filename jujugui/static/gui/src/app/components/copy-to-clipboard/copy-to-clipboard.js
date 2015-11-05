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

YUI.add('copy-to-clipboard', function() {

  juju.components.CopyToClipboard = React.createClass({

    clipboard: null,

    /* Define and validate the properites available on this component. */
    propTypes: {
      value: React.PropTypes.string
    },

    getDefaultProps: function() {
      return {
        className: 'copy-to-clipboard',
        value: ''
      };
    },

    componentDidMount: function() {
      var node = ReactDOM.findDOMNode(this).querySelector('button');
      this.clipboard = new Clipboard(node, {
        target: function(trigger) {
          return trigger.previousElementSibling;
        }
      });
    },

    componentWillUnmount: function() {
      this.clipboard.destroy();
    },

    render: function() {
      var className = this.props.className;
      return (
        <div className={className}>
          <input className={className + '__input'}
            ref="input"
            readOnly="true"
            value={this.props.value}/>
          <button className={className + '__btn'}
            ref="btn" />
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: [
    'svg-icon'
  ]
});
