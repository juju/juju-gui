/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class InspectorRelateTo extends React.Component {
  /**
    The callable to be passed to the relate to items for navigating to the
    relation type list.

    @method _relateToItemAction
    @param {Object} e The click event.
  */
  _relateToItemAction(e) {
    this.props.changeState({
      gui: {
        inspector: {
          // Application from Id
          id: this.props.application.get('id'),
          // Application to Id
          'relate-to': e.currentTarget.getAttribute('data-id'),
          activeComponent: 'relate-to'
        }
      }
    });
  }

  /**
    Generate the list items from a set of services

    @method generateItemList
    @returns {Function} A React component for the endpoints available.
  */
  generateItemList() {
    var applications = this.props.relatableApplications;
    if (applications.length === 0) {
      return (
        <div className="unit-list__message">
          No relatable endpoints available.
        </div>);
    }
    return applications.map((application, index) => {
      var data = application.getAttrs();
      return (
        <li className="inspector-view__list-item"
          data-id={data.id}
          key={data.id + index}
          onClick={this._relateToItemAction.bind(this)}
          role="button"
          tabIndex="0">
          <img className="inspector-view__item-icon" src={data.icon} />
          {data.name}
        </li>);
    });
  }

  render() {
    return (
      <div className="inspector-relate-to">
        <ul className="inspector-view__list">
          {this.generateItemList()}
        </ul>
      </div>
    );
  }
};

InspectorRelateTo.propTypes = {
  application: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  relatableApplications: PropTypes.array.isRequired
};

module.exports = InspectorRelateTo;
