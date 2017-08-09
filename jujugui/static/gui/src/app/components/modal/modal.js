/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

class Modal extends React.Component {
  render() {
    let title;
    let closeModal;
    if (this.props.title) {
      title = (<h2 className="bordered">{this.props.title}</h2>);
    }
    if (this.props.closeModal) {
      closeModal = (<span className="close" tabIndex="0" role="button"
        onClick={this.props.closeModal}>
        <juju.components.SvgIcon name="close_16"
          size="16" />
      </span>);
    }
    return (
      <div className={`modal ${this.props.extraClasses}`}>
        <div className="twelve-col no-margin-bottom">
          {title}
          {closeModal}
        </div>
        <div className="content">
          {this.props.children}
        </div>
      </div>
    );
  }
}

Modal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  extraClasses: PropTypes.string,
  title: PropTypes.any
};

YUI.add('modal', function() {
  juju.components.Modal = Modal;
}, '0.1.0', { requires: [
  'svg-icon'
]});
