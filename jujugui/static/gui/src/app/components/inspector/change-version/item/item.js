/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../../../generic-button/generic-button');

class InspectorChangeVersionItem extends React.Component {
  /**
    Generate the button label for a downgrade or upgrade.

    @method _generateButtonLabel
    @returns {String} The button label.
  */
  _generateButtonLabel() {
    return this.props.downgrade ? 'Downgrade' : 'Upgrade';
  }

  render() {
    const path = this.props.url.path();
    const props = this.props;
    return (
      <li className="inspector-current-version__item"
        onClick={props.itemAction} role="button"
        tabIndex="0">
        <span className="inspector-current-version__title" title={path}>
          version {props.url.revision}
        </span>
        <GenericButton
          action={props.buttonAction}
          disabled={props.acl.isReadOnly()}
          key={path}
          type='inline-neutral'>
          {this._generateButtonLabel()}
        </GenericButton>
      </li>
    );
  }
};

InspectorChangeVersionItem.propTypes = {
  acl: PropTypes.object.isRequired,
  buttonAction: PropTypes.func.isRequired,
  downgrade: PropTypes.bool.isRequired,
  itemAction: PropTypes.func.isRequired,
  url: PropTypes.object.isRequired
};

module.exports = InspectorChangeVersionItem;
