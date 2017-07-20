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
  Renders a new vanilla style notification
  (https://docs.vanillaframework.io/en/patterns/notification). Can be
  dismissed if a 'dismiss' function is passed, otherwise just displays
  'content' in the desired style.
*/
class Notification extends React.Component {
  /**
    Generate classes based on 'type' and extra classes.

    @return {string} The class string.
  */
  _generateClasses() {
    let classes = 'p-notification';
    if (this.props.type) {
      classes = `${classes}--${this.props.type}`;
    }
    if (this.props.extraClasses) {
      classes = `${classes} ${this.props.extraClasses}`;
    }
    return classes;
  }

  /**
    Dismiss the notification.

    @param evt {Object} The click event.
  */
  _dismiss(evt) {
    evt.stopPropagation();
    const dismiss = this.props.dismiss;
    dismiss && dismiss();
  }

  /**
    Generates the dismiss button if a dismiss function is provided.
    The parent is tasked with calling the correct dismiss functionality as
    it will be on a per use basis.

    @return {object} React Button node.
  */
  _generateDismiss() {
    if (!this.props.dismiss) {
      return;
    }
    return (
      <button
        className="p-notification__action"
        onClick={this._dismiss.bind(this)}>
        <window.juju.components.SvgIcon
          name="close_16" size="16" />
      </button>);
  }

  render() {
    const content = (<div className={this._generateClasses()}>
      <p className="p-notification__response">
        {this.props.content}
        {this._generateDismiss()}
      </p>
    </div>);
    if (this.props.isBlocking && this.props.dismiss) {
      return (
        <div className="p-notification__blocker" onClick={this.props.dismiss}>
          {content}
        </div>
      );
    } else if (this.props.isBlocking) {
      return (
        <div className="p-notification__blocker">
          {content}
        </div>
      );
    }
    return content;
  }
};

Notification.propTypes = {
  content: PropTypes.object.isRequired,
  dismiss: PropTypes.func,
  extraClasses: PropTypes.string,
  isBlocking: PropTypes.bool,
  // Types: positive, caution, negative
  type: PropTypes.string
};

YUI.add('notification', function() {
  juju.components.Notification = Notification;
}, '0.1.0', {
  requires: [
    'svg-icon'
  ]
});
