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
class Popup extends React.Component {
  /**
   Generate the buttons component if required.

   @method _generateButtons
  */
  _generateButtons() {
    const buttons = this.props.buttons;
    if (buttons) {
      return (
        <juju.components.ButtonRow
          buttons={buttons} />);
    }
  }

  /**
   Generate the close component if required.

   @method _generateClose
  */
  _generateClose() {
    const close = this.props.close;
    if (close) {
      return (
        <div className="popup__close">
          <juju.components.GenericButton
            action={close}
            type="base">
            <juju.components.SvgIcon
              name="close_16"
              size="16" />
          </juju.components.GenericButton>
        </div>);
    }
  }

  /**
   Generate the title if required.

   @method _generateTitle
  */
  _generateTitle() {
    const title = this.props.title;
    if (title) {
      return (
        <h3 className="popup__title">
          {title}
        </h3>);
    }
  }

  /**
    Generate the classes based on the props.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    return classNames(
      'popup__panel',
      `popup__panel--${this.props.type}`,
      this.props.className
    );
  }

  render() {
    return (
      <juju.components.Panel
        instanceName="popup"
        visible={true}>
        <div className={this._generateClasses()}>
          {this._generateClose()}
          {this._generateTitle()}
          {this.props.children}
          {this._generateButtons()}
        </div>
      </juju.components.Panel>
    );
  }
};

Popup.propTypes = {
  buttons: PropTypes.array,
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  className: PropTypes.string,
  close: PropTypes.func,
  title: PropTypes.string,
  type: PropTypes.string
};

Popup.defaultProps = {
  type: 'narrow',
  className: ''
};

YUI.add('popup', function() {
  juju.components.Popup = Popup;
}, '', {
  requires: [
    'button-row',
    'generic-button',
    'panel-component'
  ]
});
