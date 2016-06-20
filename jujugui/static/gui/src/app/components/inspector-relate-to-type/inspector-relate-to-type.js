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

YUI.add('inspector-relate-to-type', function() {

  juju.components.InspectorRelateToType = React.createClass({

    propTypes: {
      changeState: React.PropTypes.func.isRequired,
      createRelation: React.PropTypes.func.isRequired,
      relationTypes: React.PropTypes.array.isRequired
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
      Update the count of the number of active checkboxes.

      @method _updateActiveCount
    */
    _updateActiveCount: function() {
      var activeCount = 0;
      var refs = this.refs;
      Object.keys(refs).forEach((ref) => {
        if (ref.split('-')[0] === 'InspectorRelateToType') {
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
      @param {Object} start Start of the relation.
      @param {Object} end Far end of the relation.
      @returns {String} The relation label.
    */
    _generateRelationLabel: function(start, end) {
      return <span>{end.name} &rarr; {start.name}</span>;
    },

    /**
      Generate the relation list for the two application.

      @method _generateRelations
      @returns {Object} The relation components.
    */
    _generateRelations: function() {
      var relations = this.props.relationTypes;
      var relationTypes = [];
      if (relations.length === 0) {
        return (
          <li className="inspector-relate-to-type__message">
            No relation types for these applications.
          </li>);
      }
      relations.forEach((relation, i) => {
        var start = relation[0];
        var end = relation[1];
        var ref = 'InspectorRelateToType-' + i;
        var key = i;
        relationTypes.push(
        <juju.components.InspectorRelationsItem
          index={i}
          key={key}
          ref={ref}
          label={this._generateRelationLabel(start, end)}
          relation={relation}
          changeState={this.props.changeState}
          whenChanged={this._updateActiveCount} />);
      }, this);
      return relationTypes;
    },

    /**
      Remove the selected relations

      @method _handleRemoveRelation
    */
    _handleCreateRelation: function() {
      var relations = [];
      var refs = this.refs;
      Object.keys(refs).forEach((ref) => {
        var isInstance = ref.split('-')[0] === 'InspectorRelateToType';
        if (isInstance && refs[ref].state.checked) {
          var relationName = ref.slice(ref.indexOf('-') + 1);
          relations.push(relationName);
        }
      });
      var relationTypes = this.props.relationTypes;
      this.props.createRelation(relationTypes[relations]);
    },

    /**
      Generate the relate button.

      @method _generateButtons
      @returns {Object} The button row component.
    */
    _generateButtons: function() {
      if (this.props.relationTypes.length === 0) {
        return;
      }
      var disabled = this.state.activeCount === 0;
      var buttons = [];
      buttons.push({
        title: 'Relate',
        type: 'neutral',
        action: this._handleCreateRelation,
        disabled: disabled
      });
      return (
        <juju.components.ButtonRow
          buttons={buttons} />);
    },

    render: function() {
      return (
        <div className="inspector-relate-to-type">
          <ul className="inspector-relate-to-type__list">
            {this._generateRelations()}
          </ul>
          {this._generateButtons()}
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'inspector-relations-item',
  'button-row'
]});
