/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const GenericInput = require('../generic-input/generic-input');

class CardForm extends React.Component {
  componentDidMount() {
    this.props.createCardElement(card => {
      this.card = card;
      if (this.refs.cardNode) {
        this.card.mount('.card-form__card');
      }
    });
  }

  /**
    Validate the form.

    @method validate
    @returns {Boolean} Whether the form is valid.
  */
  validate() {
    const fields = [
      'name'
    ];
    return this.props.validateForm(fields, this.refs);
  }

  /**
    Get card data.

    @method getValue
  */
  getValue() {
    return {
      card: this.card,
      name: this.refs.name.getValue()
    };
  }

  render() {
    const disabled = this.props.acl.isReadOnly();
    const required = {
      regex: /\S+/,
      error: 'This field is required.'
    };
    return (
      <div className="card-form">
        <GenericInput
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
};

CardForm.propTypes = {
  acl: PropTypes.object.isRequired,
  createCardElement: PropTypes.func.isRequired,
  validateForm: PropTypes.func.isRequired
};

module.exports = CardForm;
