/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const Help = require('./help');
const SvgIcon = require('../svg-icon/svg-icon');
const VanillaCard = require('../vanilla/card/card');

describe('Help', () => {

  const renderComponent = (options = {}) => enzyme.shallow(
    <Help
      changeState={options.changeState || sinon.stub()}
      displayShortcutsModal={options.displayShortcutsModal || sinon.stub()}
      gisf={options.gisf}
      sendGetRequest={options.sendGetRequest || sinon.stub()}
      staticURL={options.staticURL || ''}
      user={options.user || {user: true}} />
  );

  it('renders', () => {
    const wrapper = renderComponent({ gisf: true });
    const expected = (
      <div className="help__body">
        <header className="help__header clearfix">
          <h3 className="help__header-title">
            Help
          </h3>
          <div className="help__header-search header-search">
            <form
              action="https://jujucharms.com/docs/search/"
              className="header-search__form"
              target="_blank">
              <button className="header-search__submit"
                type="submit">
                <SvgIcon
                  name="search_16"
                  size="16" />
              </button>
              <input className="header-search__input"
                name="text"
                placeholder="Search the docs"
                ref={sinon.stub()}
                type="search" />
            </form>
          </div>
        </header>
        <div className="help__content clearfix">
          <VanillaCard title="Getting started">
            <p>
              <a className="link"
                href="https://jujucharms.com/docs/stable/getting-started"
                target="_blank">
                Read the {'JAAS'} docs
              </a>.
            </p>
          </VanillaCard>
          <VanillaCard title="Tutorials">
            <p>
              Learn how to operate production-ready clusters.
            </p>
            <p>
              <a className="link charm-row"
                href="https://tutorials.ubuntu.com/tutorial/get-started-canonical-kubernetes"
                target="_blank">
                <img alt="Kubernetes logo"
                  /* eslint-disable max-len */
                  src="https://api.jujucharms.com/charmstore/v5/~containers/kubernetes-master-55/icon.svg"
                  /* eslint-enable max-len */
                  width="24" />
                Kubernetes tutorial
              </a>
            </p>
            <p>
              <a className="link charm-row"
                href="https://tutorials.ubuntu.com/tutorial/get-started-hadoop-spark"
                target="_blank">
                <img alt="Hadoop Spark logo"
                  /* eslint-disable max-len */
                  src="https://api.jujucharms.com/charmstore/v5/xenial/hadoop-client-8/icon.svg"
                  /* eslint-enable max-len */
                  width="24" />
                Hadoop Spark tutorial
              </a>
            </p>
          </VanillaCard>
          <VanillaCard title="Take a tour">
            <p>
              <img className="help__tour-image"
                src="/static/gui/build/app/assets/images/non-sprites/tour/help@1x.png"
                /* eslint-disable max-len */
                srcSet="/static/gui/build/app/assets/images/non-sprites/tour/help@2x.png 2x"
                /* eslint-enable max-len */
                width="201" />
              <span className="link"
                onClick={wrapper.find('.link').at(3).prop('onClick')}
                role="button">
                Learn how to use the canvas.
              </span>
            </p>
          </VanillaCard>
        </div>
        <footer className="help__footer clearfix">
          <div className="four-col">
            <p>
              <span className="link"
                onClick={wrapper.find('.link').at(4).prop('onClick')}
                role="button">
                Keyboard shortcuts
              </span>
            </p>
            <p>
              <a className="link"
                href="https://jujucharms.com/how-it-works#frequently-asked-questions"
                target="_blank">
                FAQs
              </a>
            </p>
            <p>
              <a className="link"
                href="https://jujucharms.com/support"
                target="_blank">
                Get support
              </a>
            </p>
          </div>
          <div className="four-col last-col">
            <p>IRC channels on Freenode</p>
            <p>
              <a className="link external"
                href="http://webchat.freenode.net/?channels=%23juju"
                target="_blank">
                #juju
              </a>
            </p>
            <p>Mailing lists</p>
            <p>
              <a className="link external"
                href="https://lists.ubuntu.com/mailman/listinfo/juju"
                target="_blank">
                The Juju project
              </a>
            </p>
          </div>
        </footer>
      </div>
    );
    assert.compareJSX(wrapper.find('.help__body'), expected);
  });

  it('renders for non-gisf', () => {
    const wrapper = renderComponent({ gisf: false });
    assert.equal(wrapper.find('.link').at(0).text(), 'Read the Juju docs');
    assert.equal(
      wrapper.find('.link').at(6).prop('href'),
      'https://jujucharms.com/docs/stable/about-juju');
  });
});
