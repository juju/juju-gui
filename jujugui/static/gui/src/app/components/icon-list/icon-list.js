/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

/**
  Display a list of icons for an entity.
*/
class IconList extends React.Component {
  constructor() {
    super();
  }

  /**
    Generate the store state for the item.
    @param {String} id The entity id.
    @returns {Object} The store state.
  */
  _generateStoreState(id) {
    // TODO frankban: it should be clear whether this id is legacy or not.
    let url;
    try {
      url = window.jujulib.URL.fromLegacyString(id);
    } catch(_) {
      url = window.jujulib.URL.fromString(id);
    }
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
    const applications = this.props.entity.applications || [this.props.entity];
    let components = [];
    applications.forEach(app => {
      const src = app.iconPath ||
          'static/gui/build/app/assets/images/non-sprites/charm_160.svg';
      components.push(
        <li className="icon-list__item tooltip"
          key={app.displayName}>
          <a className="icon-list__link"
            href={this._generateStoreURL(app.id)}
            onClick={this._handleItemClick.bind(this, app.id)}>
            <img src={src}
              className="icon-list__image"
              alt={app.displayName} />
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
  changeState: PropTypes.func.isRequired,
  entity: PropTypes.object.isRequired,
  generatePath: PropTypes.func.isRequired
};

module.exports = IconList;
