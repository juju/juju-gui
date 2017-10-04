/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

const React = require('react');

const Lightbox = require('../lightbox/lightbox');
const SvgIcon = require('../svg-icon/svg-icon');
const VanillaCard = require('../vanilla/card/card');

class Help extends React.Component {

  _handleClose() {
    this.props.changeState({
      help: null
    });
  }

  _startTour() {

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
      <div>
        <header className="help__header clearfix">
          <h2 className="help__header-title">Help</h2>
          <div className="help__header-search header-search">
            <form className="header-search__form"
              target="_blank"
              action="https://jujucharms.com/docs/search/">
              <button type="submit"
                className="header-search__submit">
                <SvgIcon name="search_16"
                  size="16" />
              </button>
              <input type="search" name="text"
                className="header-search__input"
                placeholder="Search the store"
                ref={input => {this.searchDocs = input}} />
            </form>
          </div>
        </header>
        <div className="help__content clearfix">
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
              <p>
                <a
                  href="https://tutorials.ubuntu.com/tutorial/get-started-canonical-kubernetes"
                  target="_blank">Kubernetes tutorial</a>
              </p>
              <p>
                <a
                  href="https://tutorials.ubuntu.com/tutorial/get-started-hadoop-spark"
                  target="_blank">Hadoop Spark tutorial</a>
              </p>
            </VanillaCard>
          </div>
          <div className="four-col last-col">
            <VanillaCard
              title="Take a tour">
              <p>
                <span role="button" className="link"
                  onClick={this._startTour.bind(this)}
                  >Learn how to use the canvas.
                </span>
              </p>
            </VanillaCard>
          </div>
        </div>
        <footer className="help__footer clearfix">
          <div className="four-col">
            <a href="">Keyboard shortcuts</a>
            <a href="">FAQs</a>
            <a href="">Report a bug</a>
          </div>
          <div className="four-col">
            <img src="" />
            <p>The Juju show</p>
            <p>#16 - modeling across models</p>
          </div>
          <div className="four-col last-col">
            <p>IRC channels on Freenode</p>
            <p><a href="">#juju</a></p>
            <p>Mailing lists</p>
            <p><a href="">The Juju project</a></p>
          </div>
        </footer>
      </div>
    </Lightbox>);
  }
}

Help.propTypes = {
  changeState: PropTypes.func.isRequired
};

module.exports = Help;
