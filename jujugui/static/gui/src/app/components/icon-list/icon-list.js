/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

/**
  Display a list of icons for an entity.
*/
class IconList extends React.Component {
  constructor(props) {
    super(props);
  }

  /**
    Generate the store state for the item.
    @param {String} id The entity id.
    @returns {Object} The store state.
  */
  _generateStoreState(id) {
    const url = window.jujulib.URL.fromAnyString(id);
    return {
      profile: null,
      search: null,
      store: url.path()
    };
  }

  /**
    Generate the store URL for an entity.
    @param {String} id The entity id.
    @returns {String} The store URL.
  */
  _generateStoreURL(id) {
    return this.props.generatePath(this._generateStoreState(id));
  }

  /**
    Show the entity details when clicked.

    @method _handleItemClick
    @param {String} id The entity id.
    @param {Object} evt The click event.
  */
  _handleItemClick(id, evt) {
    evt.preventDefault();
    this.props.changeState(this._generateStoreState(id));
  }

  /**
    Generate a list of icons.
    @returns {Object} The icon list JSX.
  */
  _generateIcons() {
    let components = [];
    this.props.applications.forEach(app => {
      const src = app.iconPath ||
          'static/gui/build/app/assets/images/non-sprites/charm_160.svg';
      components.push(
        <li className="icon-list__item tooltip"
          key={app.displayName}>
          <a className="icon-list__link"
            href={this._generateStoreURL(app.id)}
            onClick={this._handleItemClick.bind(this, app.id)}>
            <img alt={app.displayName}
              className="icon-list__image"
              src={src} />
            <span className="tooltip__tooltip">
              <span className="tooltip__inner tooltip__inner--down">
                {app.displayName}
              </span>
            </span>
          </a>
        </li>
      );
    }, this);
    return components;
  }

  render() {
    return (
      <ul className="icon-list">
        {this._generateIcons()}
      </ul>);
  }

};

IconList.propTypes = {
  applications: PropTypes.arrayOf(PropTypes.shape({
    displayName: PropTypes.string.isRequired,
    iconPath: PropTypes.string,
    id: PropTypes.string.isRequired
  }).isRequired).isRequired,
  changeState: PropTypes.func.isRequired,
  generatePath: PropTypes.func.isRequired
};

module.exports = IconList;
