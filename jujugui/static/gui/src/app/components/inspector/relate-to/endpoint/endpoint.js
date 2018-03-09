/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ButtonRow = require('../../../button-row/button-row');
const CheckListItem = require('../../../check-list-item/check-list-item');

class InspectorRelateToEndpoint extends React.Component {
  constructor() {
    super();
    this.state = {activeCount: 0};
  }

  /**
    Update the count of the number of active checkboxes.

    @method _updateActiveCount
  */
  _updateActiveCount() {
    var activeCount = 0;
    var refs = this.refs;
    Object.keys(refs).forEach(ref => {
      if (ref.split('-')[0] === 'InspectorRelateToEndpoint') {
        if (refs[ref].state.checked) {
          activeCount += 1;
        }
      }
    });
    this.setState({'activeCount': activeCount});
  }

  /**
    Generate the relation list for the two application.

    @method _generateRelations
    @returns {Object} The relation components.
  */
  _generateRelations() {
    var relations = this.props.endpoints;
    if (relations.length === 0) {
      return (
        <li className="inspector-relate-to-endpoint__message">
          No relatable endpoints for these applications.
        </li>);
    }
    return relations.map((relation, index) => {
      return (<CheckListItem
        key={index}
        label={`${relation[0].name} → ${relation[1].name}`}
        ref={`InspectorRelateToEndpoint-${index}`}
        whenChanged={this._updateActiveCount.bind(this)} />);
    });
  }

  /**
    Create the selected relations

    @method _handleCreateRelation
  */
  _handleCreateRelation() {
    var refs = this.refs;
    var props = this.props;
    Object.keys(refs).forEach(ref => {
      var isInstance = ref.split('-')[0] === 'InspectorRelateToEndpoint';
      if (isInstance && refs[ref].state.checked) {
        var relationName = ref.slice(ref.indexOf('-') + 1);
        var relations = props.endpoints[relationName];
        props.createRelation([[
          relations[0].service, {
            name: relations[0].name,
            role: 'client'
          }
        ], [
          relations[1].service, {
            name: relations[1].name,
            role: 'server'
          }
        ]]);
      }
    });
    props.changeState(props.backState);
  }

  /**
    Generate the relate button.

    @method _generateButtons
    @returns {Object} The button row component.
  */
  _generateButtons() {
    if (this.props.endpoints.length === 0) {
      return;
    }
    var disabled = this.state.activeCount === 0;
    var buttons = [];
    buttons.push({
      title: 'Relate',
      type: 'neutral',
      action: this._handleCreateRelation.bind(this),
      disabled: disabled
    });
    return (
      <ButtonRow
        buttons={buttons} />);
  }

  render() {
    return (
      <div className="inspector-relate-to-endpoint">
        <ul className="inspector-relate-to-endpoint__list">
          {this._generateRelations()}
        </ul>
        {this._generateButtons()}
      </div>
    );
  }
};

InspectorRelateToEndpoint.propTypes = {
  backState: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  createRelation: PropTypes.func.isRequired,
  endpoints: PropTypes.array.isRequired
};

module.exports = InspectorRelateToEndpoint;
