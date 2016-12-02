/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.
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

YUI.add('inspector-relations', function() {

  juju.components.InspectorRelations = React.createClass({

    propTypes: {
      acl: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      destroyRelations: React.PropTypes.func.isRequired,
      service: React.PropTypes.object.isRequired,
      serviceRelations: React.PropTypes.array.isRequired
    },

    /**
      Generate the initial state.

      @method getInitialState
      @returns {String} The intial state.
    */
    getInitialState: function() {
      return {activeCount: 0};
    },

    /**
      Fires changeState to update the UI based on the component clicked.

      @method _showCreateRelation
      @param {Object} e The click event.
    */
    _showCreateRelation: function(e) {
      this.props.changeState({
        gui: {
          inspector: {
            id: this.props.service.get('id'),
            activeComponent: 'relate-to'
          }}});
    },

    /**
      Update the count of the number of active checkboxes.

      @method _updateActiveCount
    */
    _updateActiveCount: function() {
      var activeCount = 0;
      var refs = this.refs;
      Object.keys(refs).forEach((ref) => {
        if (ref.split('-')[0] === 'CheckListItem') {
          if (refs[ref].state.checked) {
            activeCount += 1;
          }
        }
      });
      this.setState({'activeCount': activeCount});
    },

    /**
      Generate the relation label.

      @method _generateRelationLabel
      @param {Object} The relation object.
      @returns {String} The relation label.
    */
    _generateRelationLabel: function(relation) {
      var endpoint = relation.far;
      return `${endpoint.serviceName}:${endpoint.name}`;
    },

    /**
      Generate the relation list of components.

      @method _generateRelations
      @returns {Object} The relation components.
    */
    _generateRelations: function() {
      var relations = this.props.serviceRelations;
      var disabled = this.props.acl.isReadOnly();
      var activeRelations = [];
      // Remove deleted relations from the list
      for (var i in relations) {
        if (relations.hasOwnProperty(i) &&
            // Excluded deleted relations.
            !relations[i].deleted &&
            // Exclude peer relations as they cannot be removed.
            relations[i].near.role !== 'peer') {
          activeRelations.push(relations[i]);
        }
      }
      relations = activeRelations;
      if (relations.length === 0) {
        return (
          <li className="inspector-relations__message">
            No active relations for this application.
          </li>);
      }
      var ref = 'select-all';
      var components = [
        <juju.components.CheckListItem
          className='select-all'
          disabled={disabled}
          key={ref+'1'}
          ref={ref}
          label='Select all relations'
          whenChanged={this._selectAllRelations}/>
      ];

      relations.forEach(function(relation, index) {
        var ref = 'CheckListItem-' + relation.id;
        components.push(
        <juju.components.CheckListItem
          action={this._handleRelationClick.bind(this, index)}
          disabled={disabled}
          key={relation.id}
          ref={ref}
          label={this._generateRelationLabel(relation)}
          relation={relation}
          changeState={this.props.changeState}
          whenChanged={this._updateActiveCount} />);
      }, this);
      return components;
    },

    /**
      Handle navigating to a relation details when it is clicked.

      @method _handleRelationClick
    */
    _handleRelationClick: function(index) {
      // Cast to string to pass state null check
      index = index + '';
      this.props.changeState({
        gui: {
          inspector: {
            activeComponent: 'relation',
            unit: index
          }
        }
      });
    },

    /**
      Remove the selected relations

      @method _handleRemoveRelation
    */
    _handleRemoveRelation: function() {
      var relations = [];
      var refs = this.refs;
      Object.keys(refs).forEach((ref) => {
        var isInstance = ref.split('-')[0] === 'CheckListItem';
        if (isInstance && refs[ref].state.checked) {
          var relationName = ref.slice(ref.indexOf('-') + 1);
          relations.push(relationName);
        }
      });
      this.props.destroyRelations(relations);
      this._selectAllRelations(false);
    },

    /**
      Sets the selectAll state property based on the "select all" child
      component.

      @method _selectAllRelations
      @param {Boolean} checked Whether to check or uncheck the relations.
    */
    _selectAllRelations: function(checked) {
      var refs = this.refs;
      Object.keys(refs).forEach((ref) => {
        if (ref.split('-')[0] === 'CheckListItem') {
          refs[ref].setState({
            checked: checked
          }, () => {
            // After the state has been updated then update the active unit
            // count to enable/disable the buttons.
            this._updateActiveCount();
          });
        }
      });
    },

    /**
      Generate the remove button.

      @method _generateButtons
      @returns {Object} The button row component.
    */
    _generateButtons: function() {
      if (this.props.serviceRelations.length === 0) {
        return;
      }
      var disabled = this.state.activeCount === 0 ||
        this.props.acl.isReadOnly();
      var buttons = [];
      buttons.push({
        title: 'Remove',
        type: 'neutral',
        action: this._handleRemoveRelation,
        disabled: disabled
      });
      return (
        <juju.components.ButtonRow
          buttons={buttons} />);
    },

    /**
      Generate the build relation action.

      @method _generateButtons
      @returns {Object} The build relation component.
    */
    _generateBuildRelation: function() {
      return (
        <div className="inspector-relations__actions">
          <juju.components.OverviewAction
            action={this._showCreateRelation}
            icon="plus_box_16"
            title="Build a relation" />
        </div>);
    },

    render: function() {
      return (
        <div className="inspector-relations">
          {this._generateBuildRelation()}
          <ul className="inspector-relations__list">
            {this._generateRelations()}
          </ul>
          {this._generateButtons()}
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'check-list-item',
  'button-row',
  'overview-action'
]});
