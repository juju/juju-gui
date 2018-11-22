/* Copyright (C) 2018 Canonical Ltd. */
'use strict';

const React = require('react');
const PropTypes = require('prop-types');

require('./_error-boundary.scss');

class errorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {error: null};
  }

  componentDidCatch(error) {
    this.setState({error});
  }

  render() {
    const error = this.state.error;
    if (error) {
      return (
        <div className="v1">
          <div className="row">
            <div className="col-12">
              <div className="p-notification--negative">
                <p className="p-notification__response">
                  Hmm.. something has went wrong with this part of the application.
                  If this problem persists, please <a
                    className="p-link--external"
                    href="https://github.com/CanonicalLtd/jujucharms.com">
                    raise an issue</a> with the contents of the error message below.
                  {error.message &&
                    <pre className="error_boundary__code-snippet">
                      <code>{error.message} </code>
                    </pre>
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

errorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

module.exports = errorBoundary;
