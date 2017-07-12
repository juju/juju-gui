/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/**
  A single accordion section, with clickable header and collapsable content.
  Providing a height will animate the opening and closing.

  XXX: I'd like to remove the requirement for height when animating, but I
  ran out of time when building this. Luke 12-07-2017.
*/
class AccordionSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: this.props.startOpen || !this.props.title
    };
  }

  /**
    Toggles the collapsable content section.
  */
  _toggle() {
    this.setState({open: !this.state.open});
  }

  /**
    Get's the height based on some rules.

    @return {Number|Boolean} The height, or false to clear the style property.
  */
  _getHeight() {
    // If there isn't a title, there's nothing to click so remove the ability.
    // If openHeight isn't defined and we want it to be open, we remove the
    // style (setting to 'auto' does not work).
    if (!this.props.title ||
      (this.props.openHeight === undefined && this.state.open)) {
      return false;
    }

    if (this.props.openHeight && this.state.open) {
      return this.props.openHeight;
    }

    // If none of the above, it should be closed.
    return 0;
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
    const style = {'maxHeight': this._getHeight()};
    return (<div className='accordion-section__content'
      style={style}>
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
  children: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.object
  ]),
  openHeight: React.PropTypes.number,
  startOpen: React.PropTypes.bool,
  title: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.object
  ])
};

YUI.add('accordion-section', function() {
  juju.components.AccordionSection = AccordionSection;
}, '0.1.0', {
  requires: [
    'svg-icon'
  ]
});
