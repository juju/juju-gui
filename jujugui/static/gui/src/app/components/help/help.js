/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

const React = require('react');

const Lightbox = require('../lightbox/lightbox');
const VanillaCard = require('../vanilla/card/card');

class Help extends React.Component {
  
  _handleClose() {
    this.props.changeState({
      help: null
    });
  }

  render() {
    const gettingStartedContent = (
      <div>
        <h3 className="p-card__title">Getting started</h3>
        <p>Read the JAAS docs</p>
      </div>
    );
    return (<Lightbox
      close={this._handleClose.bind(this)}>
      <header className="help__header">
        <h1 className="help__header-title">Help</h1>
        <div className="help__header-search">Search</div>
      </header>
      <div className="help__content">
        <div className="four-col">
          <VanillaCard
            headerContent={gettingStartedContent}
            title="Got Juju installed?">
            <p>If you already have Juju, be sure to&nbsp;
            <a href="" target="_blank" className="external">read the Juju docs</a>
            .</p>
          </VanillaCard>
        </div>
        <div className="four-col">
          <VanillaCard
            title="Tutorials">
            <p>Learn how to operate production-ready clusters.</p>
            <p>Kubernetes tutorial</p>
            <p>Hadoop Spark tutorial</p>
          </VanillaCard>
        </div>
        <div className="four-col last-col">
          <VanillaCard
            title="Take a tour">
            <p>Learn how to use the canvas.</p>
          </VanillaCard>
        </div>
      </div>
      <footer className="help__footer">
        <div className="four-col"></div>
        <div className="four-col"></div>
        <div className="four-col last-col"></div>
      </footer>
    </Lightbox>);
  }
}

Help.propTypes = {
  changeState: PropTypes.func.isRequired
};

module.exports = Help;
