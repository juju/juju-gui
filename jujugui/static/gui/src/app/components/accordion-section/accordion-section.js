/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/**
  A single accordion section, with clickable header and collapsable content.
  Providing a height will animate the opening and closing.
*/
class AccordionSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: this.props.startOpen
    };
  }

  /**
    Toggles the collapsable content section.
  */
  _toggle() {
    this.setState({open: !this.state.open});
  }

  /**
    Get's the content style based on some rules.

    @return {Object} Object of CSS styles.
  */
  _getStyle() {
    return {
      maxHeight: this.state.open ?
        this['accordion-section-content'].scrollHeight : 0
    };
  }

  /**
    Generates the clickable title element.

    @return {Object} The React div element.
  */
  _generateTitle() {
    if (!this.props.title) {
      return null;
    }
    const chevron = this.state.open ? 'chevron_up_16' : 'chevron_down_16';
    return (<div
      className="accordion-section__title"
      onClick={this._toggle.bind(this)}>{this.props.title}
      <juju.components.SvgIcon
        name={chevron}
        size="16" className="right" />
    </div>);
  }

  /**
    Generates the content from the components children.

    @return {Object} The React div element.
  */
  _generateContent() {
    return (<div className="accordion-section__content"
      ref={(div) => { this['accordion-section-content'] = div; }}
      style={this._getStyle()}>
      {this.props.children}
    </div>);
  }

  render() {
    return (
      <div className="accordion-section">
        {this._generateTitle()}
        {this._generateContent()}
      </div>
    );
  }
};

AccordionSection.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  startOpen: PropTypes.bool,
  title: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ])
};

YUI.add('accordion-section', function() {
  juju.components.AccordionSection = AccordionSection;
}, '0.1.0', {
  requires: [
    'svg-icon'
  ]
});
