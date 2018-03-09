/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

class AddedServicesListItem extends React.Component {
  /**
    Parses the supplied unit data to return the status color and number
    to display.
    @param {Array} units An array of units.
  */
  _getPriorityUnits(units) {
    var unitStatuses = this.props.getUnitStatusCounts(units);
    var top = { priority: 99, key: '', size: 0 };
    var status;
    for (var key in unitStatuses) {
      status = unitStatuses[key];
      if (key !== 'started' && status.priority < top.priority &&
          status.size > 0) {
        top = {
          key: key,
          priority: status.priority,
          size: status.size
        };
      }
    }
    // size needs to be a string for test comparison purposes because react
    // converts this to a string for output but doesn't convert it in
    // the js dom.
    top.size = top.size + '';
    return top;
  }

  /**
    Renders and returns the status icon if necessary.
    @param {Object} statusData The status data that will be used to generate
      the status icon.
  */
  _renderStatusIndicator(statusData) {
    var shownStatuses = ['uncommitted', 'pending', 'error'];
    var className = 'inspector-view__status--' + statusData.key;
    if (shownStatuses.indexOf(statusData.key) > -1) {
      return (
        <span className={className}>{statusData.size}</span>
      );
    }
  }

  /**
    Click handler for clicks on the entire list item.
    @param {Object} e The click event.
  */
  _onClickHandler(e) {
    this.props.panToService(this.props.service.get('id'));
    this.props.changeState({
      gui: {
        inspector: {
          id: e.currentTarget.getAttribute('data-serviceid')
        }
      }
    });
  }

  _generateClassName() {
    var props = this.props;
    var service = props.service;
    return classNames(
      'inspector-view__list-item',
      {
        'visibility-toggled': service.get('highlight') || service.get('fade'),
        hover: props.hovered
      }
    );
  }

  /**
    Handle highlighting a service token when the item is hovered.
    @param {Object} e The mouse event.
  */
  _onMouseEnter(e) {
    this.props.hoverService(this.props.service.get('id'), true);
  }

  /**
    Handle unhighlighting a service token when the item is no longer hovered.
    @param {Object} e The mouse event.
  */
  _onMouseLeave(e) {
    this.props.hoverService(this.props.service.get('id'), false);
  }

  render() {
    var service = this.props.service.getAttrs();
    var statusData = this._getPriorityUnits(service.units.toArray());
    var statusIndicator = this._renderStatusIndicator(statusData);
    return (
      <li className={this._generateClassName()}
        data-serviceid={service.id}
        onClick={this._onClickHandler.bind(this)}
        onMouseEnter={this._onMouseEnter.bind(this)}
        onMouseLeave={this._onMouseLeave.bind(this)}
        role="button"
        tabIndex="0">
        <img className="inspector-view__item-icon" src={service.icon} />
        <span className="inspector-view__item-count">
          {service.unit_count}
        </span>
        {' '}
        <span className="inspector-view__item-name">
          {service.name}
        </span>
        <span className="inspector-view__status-block">
          {statusIndicator}
        </span>
      </li>
    );
  }
};

AddedServicesListItem.propTypes = {
  changeState: PropTypes.func.isRequired,
  getUnitStatusCounts: PropTypes.func.isRequired,
  hoverService: PropTypes.func.isRequired,
  hovered: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  panToService: PropTypes.func.isRequired,
  service: PropTypes.object.isRequired
};

module.exports = AddedServicesListItem;
