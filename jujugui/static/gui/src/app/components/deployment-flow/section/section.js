/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

YUI.add('deployment-section', function() {

  juju.components.DeploymentSection = React.createClass({

    propTypes: {
      buttons: React.PropTypes.array,
      children: React.PropTypes.oneOfType([
        React.PropTypes.array,
        React.PropTypes.object
      ]),
      completed: React.PropTypes.bool,
      disabled: React.PropTypes.bool,
      showCheck: React.PropTypes.bool,
      title: React.PropTypes.oneOfType([
        React.PropTypes.array,
        React.PropTypes.object,
        React.PropTypes.string
      ])
    },

    /**
      Generate the actions.

      @method _generateCheck
      @returns {Object} The actions markup.
    */
    _generateActions: function() {
      var buttons = this.props.buttons;
      if (!buttons) {
        return;
      }
      return (
        <div className="deployment-section__actions">
          <juju.components.ButtonRow
            buttons={this.props.buttons} />
        </div>);
    },

    /**
      Generate the check icon if it should be displayed.

      @method _generateCheck
      @returns {Object} The check markup.
    */
    _generateCheck: function() {
      if (!this.props.showCheck) {
        return;
      }
      return (
        <juju.components.SvgIcon
          className="deployment-section__title-checkmark"
          name="complete"
          size="24" />);
    },

    /**
      Generate the mask if the component is disabled.

      @method _generateMask
      @returns {Object} The mask markup.
    */
    _generateMask: function() {
      if (!this.props.disabled) {
        return;
      }
      return (
        <div className="deployment-section__mask"></div>);
    },

    render: function() {
      var classes = classNames(
        'deployment-section',
        'twelve-col',
        {'deployment-section--completed': this.props.completed});
      return (
        <div className={classes}>
          {this._generateMask()}
          {this._generateActions()}
          <h3 className="deployment-section__title">
            {this._generateCheck()}
            {this.props.title}
          </h3>
          {this.props.children}
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'button-row',
  'svg-icon'
]});
