/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

class Lightbox extends React.Component {
  render() {
    let caption;

    if (this.props.caption) {
      caption = (
        <div className="lightbox__content-caption">
          {this.props.caption}
        </div>
      );
    }
    return (
      <div className="lightbox" onClick={this.props.close}>
        <button className="lightbox__close">
          <juju.components.SvgIcon name="close_16_white" width="16" />
        </button>
        <div className="lightbox__content">
          <div className="lightbox__content-image">
            {this.props.children}
          </div>
          {caption}
        </div>
      </div>
    );
  }
};

Lightbox.propTypes = {
  caption: PropTypes.string,
  close: PropTypes.func.isRequired
};

YUI.add('lightbox', function() {
  juju.components.Lightbox = Lightbox;
}, '0.1.0', {
  requires: [
    'svg-icon'
  ]
});
