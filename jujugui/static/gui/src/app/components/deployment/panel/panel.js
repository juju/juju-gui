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

YUI.add('deployment-panel', function() {

  juju.components.DeploymentPanel = React.createClass({

    propTypes: {
      buttons: React.PropTypes.array,
      changeState: React.PropTypes.func.isRequired,
      steps: React.PropTypes.array.isRequired,
      visible: React.PropTypes.bool.isRequired
    },

    /**
      Generate the list of steps.

      @method _generateSteps
      @returns {Array} The list of steps.
    */
    _generateSteps: function() {
      var components = [];
      this.props.steps.forEach(function(step) {
        var className = classNames(
          'deployment-panel__header-step', {
            'deployment-panel__header-step--active': step.active
          }
        );
        components.push(
          <li className={className}
            key={step.title}>
            {step.title}
          </li>);
      }, this);
      return (
        <ul className="deployment-panel__header-steps">
          {components}
        </ul>);
    },

    /**
      Generate the list of buttons.

      @method _generateButtons
      @returns {Object} The markup for the buttons.
    */
    _generateButtons: function() {
      var buttons = this.props.buttons;
      if (!buttons) {
        return;
      }
      return (
        <div className="deployment-panel__footer">
          <div className="twelve-col no-margin-bottom">
            <div className="inner-wrapper">
              <juju.components.ButtonRow
                buttons={buttons} />
            </div>
          </div>
        </div>);
    },

    /**
      Handle closing the panel when the close button is clicked.

      @method _handleClose
    */
    _handleClose: function() {
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: {}
        }
      });
    },

    render: function() {
      return (
        <juju.components.Panel
          instanceName="deployment-panel"
          visible={this.props.visible}>
          <div className="deployment-panel__scroll">
            <div className="deployment-panel__header">
              <juju.components.SvgIcon
                height="30"
                name="juju-logo"
                width="75" />
              {this._generateSteps()}
              <span className="deployment-panel__close">
                <juju.components.GenericButton
                  action={this._handleClose}
                  type="neutral"
                  title="Back to canvas" />
              </span>
            </div>
            <div className="deployment-panel__content">
              <div className="twelve-col">
                <div className="inner-wrapper">
                  {this.props.children}
                </div>
              </div>
            </div>
            {this._generateButtons()}
          </div>
        </juju.components.Panel>
      );
    }
  });

}, '0.1.0', { requires: [
  'generic-button',
  'button-row',
  'panel-component',
  'svg-icon'
]});
