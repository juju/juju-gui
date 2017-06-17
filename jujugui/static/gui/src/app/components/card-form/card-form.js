/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

const CardForm = React.createClass({
  displayName: 'CardForm',

  propTypes: {
    acl: React.PropTypes.object.isRequired,
    createCardElement: React.PropTypes.func.isRequired,
    validateForm: React.PropTypes.func.isRequired
  },

  componentDidMount: function() {
    this.props.createCardElement(card => {
      this.card = card;
      if (this.refs.cardNode) {
        this.card.mount('.card-form__card');
      }
    });
  },

  /**
    Validate the form.

    @method validate
    @returns {Boolean} Whether the form is valid.
  */
  validate: function() {
    const fields = [
      'name'
    ];
    return this.props.validateForm(fields, this.refs);
  },

  /**
    Get card data.

    @method getValue
  */
  getValue: function() {
    return {
      card: this.card,
      name: this.refs.name.getValue()
    };
  },

  render: function() {
    const disabled = this.props.acl.isReadOnly();
    const required = {
      regex: /\S+/,
      error: 'This field is required.'
    };
    return (
      <div className="card-form">
        <juju.components.GenericInput
          disabled={disabled}
          label="Name on card"
          ref="name"
          required={true}
          validate={[required]} />
        <div className="card-form__card"
          ref="cardNode"></div>
      </div>
    );
  }

});

YUI.add('card-form', function() {
  juju.components.CardForm = CardForm;
}, '0.1.0', {
  requires: [
    'generic-input'
  ]
});
