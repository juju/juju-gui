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

YUI.add('deployment-terms', function() {

  juju.components.DeploymentTerms = React.createClass({
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      applications: React.PropTypes.array,
      charmsGetById: React.PropTypes.func.isRequired,
      getAgreements: React.PropTypes.func.isRequired,
      setTerms: React.PropTypes.func.isRequired,
      showTerms: React.PropTypes.func.isRequired,
      terms: React.PropTypes.array.isRequired
    },

    getDefaultProps: function() {
      return {
        applications: [],
        terms: []
      };
    },

    getInitialState: function() {
      this.xhrs = [];
      return {
        loadingTerms: true
      };
    },

    componentWillMount: function() {
      this._getAgreements();
    },

    componentWillReceiveProps: function(nextProps) {
      const newApps = nextProps.applications.map(app => app.get('id'));
      const currentApps = this.props.applications.map(app => app.get('id'));
      if (newApps.length !== currentApps.length ||
        currentApps.filter(a => newApps.indexOf(a) === -1).length > 0) {
        this._getAgreements();
      }
    },

    componentWillUnmount: function() {
      this.xhrs.forEach((xhr) => {
        xhr && xhr.abort && xhr.abort();
      });
    },

    /**
      Get the list of terms that the user has already agreed to.

      @method _getAgreements
    */
    _getAgreements: function() {
      // Get the list of terms for the uncommitted apps.
      const terms = this._getTerms();
      // If there are no charms with terms then we don't need to display
      // anything.
      if (terms.length === 0) {
        this.props.setTerms([]);
        this.setState({loadingTerms: false});
        return;
      }
      const xhr = this.props.getAgreements((error, agreements) => {
        if (error) {
          console.error('cannot retrieve agreements:', error);
        }
        agreements = agreements || [];
        const agreed = agreements.map(agreement => {
          return agreement.term;
        });
        const newTerms = terms.filter(term => {
          return agreed.indexOf(term) === -1;
        });
        // Reset the terms so that we don't keep pushing the same terms.
        this.props.setTerms([]);
        newTerms.forEach(term => {
          const xhr = this.props.showTerms(term, null, (error, term) => {
            if (error) {
              console.error('cannot retrieve terms:', error);
            }
            this.props.setTerms(this.props.terms.concat([term]));
          });
          this.xhrs.push(xhr);
          this.setState({loadingTerms: false});
        });
        this.xhrs.push(xhr);
      });
      this.xhrs.push(xhr);
    },

    /**
      Generate the terms the user needs to agree to.

      @method _generateTerms
      @returns {Object} The terms markup.
    */
    _generateTerms: function() {
      if (this.props.terms.length === 0) {
        return;
      }
      let terms = [];
      this.props.terms.forEach(term => {
        terms.push(
          <li className="deployment-flow__terms-item"
            key={term.name}>
            <pre>
              {term.content}
            </pre>
          </li>);
      });
      return (
        <ul className="deployment-flow__terms-list">
          {terms}
        </ul>);
    },

    /**
      Get the list of terms for the uncommitted apps.

      @method _getTerms
      @returns {Array} The list of terms.
    */
    _getTerms: function() {
      let termIds = [];
      this.props.applications.forEach(app => {
        // Get the terms from the app's charm.
        const terms = this.props.charmsGetById(app.get('charm')).get('terms');
        if (terms && terms.length > 0) {
          // If there are terms then add them if they haven't already been
          // recorded.
          terms.forEach(id => {
            if (termIds.indexOf(id) === -1) {
              termIds.push(id);
            }
          });
        }
      });
      return termIds;
    },

    render: function() {
      if (this.state.loadingTerms) {
        return (
          <div className="deployment-terms__loading">
            <juju.components.Spinner />
          </div>);
      }
      // Control the visibility of the terms component inside the component so
      // it can do the terms lookup to determine if it needs to be visible.
      if (this.props.terms.length === 0) {
        return <div></div>;
      }
      var disabled = this.props.acl.isReadOnly();
      return (
        <div>
          <div>
            {this._generateTerms()}
          </div>
          <div className="deployment-flow__deploy-option">
            <input className="deployment-flow__deploy-checkbox"
              disabled={disabled}
              id="terms"
              type="checkbox" />
            <label className="deployment-flow__deploy-label"
              htmlFor="terms">
              I agree lorem ipsum.
            </label>
          </div>
        </div>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'loading-spinner'
  ]
});
