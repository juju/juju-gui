/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

/**
  Popup provides a React component for modal confirmation of an
  action.
*/
const Popup = React.createClass({
  displayName: 'Popup',

  propTypes: {
    buttons: React.PropTypes.array,
    children: React.PropTypes.oneOfType([
      React.PropTypes.object,
      React.PropTypes.array
    ]),
    className: React.PropTypes.string,
    close: React.PropTypes.func,
    title: React.PropTypes.string,
    type: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      type: 'narrow',
      className: ''
    };
  },

  /**
   Generate the buttons component if required.

   @method _generateButtons
  */
  _generateButtons: function() {
    const buttons = this.props.buttons;
    if (buttons) {
      return (
        <juju.components.ButtonRow
          buttons={buttons} />);
    }
  },

  /**
   Generate the close component if required.

   @method _generateClose
  */
  _generateClose: function() {
    const close = this.props.close;
    if (close) {
      return (
        <div className="popup__close">
          <juju.components.GenericButton
            action={close}
            type="base"
            icon="close_16" />
        </div>);
    }
  },

  /**
   Generate the title if required.

   @method _generateTitle
  */
  _generateTitle: function() {
    const title = this.props.title;
    if (title) {
      return (
        <h3 className="popup__title">
          {title}
        </h3>);
    }
  },

  /**
    Generate the classes based on the props.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses: function() {
    return classNames(
      'popup__panel',
      `popup__panel--${this.props.type}`,
      this.props.className
    );
  },

  render: function() {
    return (
      <juju.components.Panel
        instanceName="popup"
        visible={true}>
        <div className={this._generateClasses()}>
          <div className="popup__header">
            {this._generateClose()}
            {this._generateTitle()}
          </div>
          {this.props.children}
          {this._generateButtons()}
        </div>
      </juju.components.Panel>
    );
  }

});

YUI.add('popup', function() {
  juju.components.Popup = Popup;
}, '', {
  requires: [
    'button-row',
    'generic-button',
    'panel-component'
  ]
});
