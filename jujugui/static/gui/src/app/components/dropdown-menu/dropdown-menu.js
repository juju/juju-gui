/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

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
      <juju.components.Panel instanceName={instanceName} visible={true}>
        <ul className="dropdown-menu__list">
          {this.props.children}
        </ul>
      </juju.components.Panel>
    );
  }
};

DropdownMenu.propTypes = {
  // The children need to be <li>.
  children: PropTypes.oneOfType([
    React.PropTypes.arrayOf(React.PropTypes.node),
    React.PropTypes.node
  ]).isRequired,
  classes: PropTypes.array,
  handleClickOutside: PropTypes.func
};

YUI.add('dropdown-menu', function() {
  juju.components.DropdownMenu = enhanceWithClickOutside(DropdownMenu);
}, '', {
  requires: [
    'panel-component'
  ]
});
