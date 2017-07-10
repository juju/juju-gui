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

class AccordionSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: this.props.startOpen || !this.props.title
    };
  }

  _toggle() {
    this.setState({open: !this.state.open});
  }

  _getHeight() {
    if (!this.props.title ||
      (typeof(this.props.openHeight) === 'undefined' && this.state.open)) {
      return false;
    }

    if (this.props.openHeight && this.state.open) {
      return this.props.openHeight;
    }

    return 0;
  }

  _generateTitle() {
    if (!this.props.title) {
      return null;
    }
    const chevron = this.state.open ? 'chevron_up_16' : 'chevron_down_16';
    return (<div
      className="accordion-section__title"
      onClick={this._toggle}>{this.props.title}
      <juju.components.SvgIcon
        name={chevron}
        size="16" className="right" />
    </div>);
  }

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
  children: React.PropTypes.children,
  openHeight: React.PropTypes.number,
  startOpen: React.PropTypes.bool,
  title: React.PropTypes.object
};

YUI.add('accordion-section', function() {
  juju.components.AccordionSection = AccordionSection;
}, '0.1.0', {
  requires: []
});
