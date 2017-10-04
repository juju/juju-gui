/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const enhanceWithClickOutside = require('../../init/react-click-outside');

const Panel = require('../panel/panel');

/**
  Creates a dropdown menu with the supplied children as items.
*/
class DropdownMenu extends React.Component {

  /**
    When the menu is shown, clicking anywhere but the menu will close
    the menu.
    @param {Object} evt The click event.
  */
  handleClickOutside(evt) {
    this.props.handleClickOutside(evt);
  }

  render() {
    const instanceName = classNames(
      'dropdown-menu',
      this.props.classes
    );
    return (
      <Panel instanceName={instanceName} visible={true}>
        <ul className="dropdown-menu__list">
          {this.props.children}
        </ul>
      </Panel>
    );
  }
};

DropdownMenu.propTypes = {
  // The children need to be <li>.
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  classes: PropTypes.array,
  handleClickOutside: PropTypes.func
};

module.exports = enhanceWithClickOutside(DropdownMenu);
