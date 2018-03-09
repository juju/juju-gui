/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../svg-icon/svg-icon');
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

  componentDidMount() {
    // After the div is mounted then set the max-height to the actual
    // height of the div. This is only required when the section starts
    // expanded as the div does not exist when the first max-height
    // calculation is made.
    if (this.props.startOpen) {
      const styles = this._getStyle();
      this.refs.content.style.maxHeight = styles.maxHeight;
    }
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
    const content = this.refs.content;
    // If the content does not yet exist then set it to a very high number so
    // that the content does not get cut off.
    const scrollHeight = content ? content.scrollHeight : 9999999;
    return {
      maxHeight: this.state.open ? scrollHeight + 'px' : 0
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
    const chevron = this.state.open ?
      'chevron_up_16' : 'chevron_down_16';
    const icon = this.props.children ? (
      <SvgIcon
        className="right"
        name={chevron}
        size="16" />) : null;
    const role = this.props.children ? 'button' : null;
    const onClick = this.props.children ? this._toggle.bind(this) : null;
    return (<div
      className="accordion-section__title"
      onClick={onClick}
      role={role}>
      <span className="accordion-section__title-content">
        {this.props.title}
      </span>
      {icon}
    </div>);
  }

  /**
    Generates the content from the components children.

    @return {Object} The React div element.
  */
  _generateContent() {
    return (<div className="accordion-section__content"
      ref="content"
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

module.exports = AccordionSection;
