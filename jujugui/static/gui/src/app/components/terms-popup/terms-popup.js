/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

class TermsPopup extends React.Component {
  render() {
    let content;
    const terms = this.props.terms;
    if (terms.length === 0) {
      content = <juju.components.Spinner />;
    } else {
      const termsList = terms.map(term => {
        return (
          <li key={term.name}>
            <pre>{term.content}</pre>
          </li>
        );
      });
      content = (
        <div className="terms-popup__container">
          <ul className="terms-popup__terms">
            {termsList}
          </ul>
        </div>);
    }
    return (
      <juju.components.Popup
        close={this.props.close}
        type="wide">
        {content}
      </juju.components.Popup>);
  }
};

TermsPopup.propTypes = {
  close: React.PropTypes.func.isRequired,
  terms: React.PropTypes.array.isRequired
};

YUI.add('terms-popup', function() {
  juju.components.TermsPopup = TermsPopup;
}, '0.1.0', {
  requires: [
    'loading-spinner',
    'popup'
  ]
});
