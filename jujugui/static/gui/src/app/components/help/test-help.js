/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const Help = require('./help');
const Lightbox = require('../lightbox/lightbox');
const SvgIcon = require('../svg-icon/svg-icon');
const VanillaCard = require('../vanilla/card/card');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Help', () => {
  it('renders', () => {
    const renderer = jsTestUtils.shallowRender(<Help
      changeState={sinon.stub()}
      displayShortcutsModal={sinon.stub()}
      gisf={true}
      sendGetRequest={sinon.stub()}
      staticURL=""
      user={{user: true}} />, true);
    const output = renderer.getRenderOutput();
    expect(
      output
    ).toEqualJSX(
      <Lightbox
        close={sinon.stub()}
        extraClasses={['help']}>
        <div>
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
                  Read the JAAS docs
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
                  onClick={sinon.stub()}
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
                  onClick={sinon.stub()}
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
      </Lightbox>
    );
  });

  it('renders for non-gisf', () => {
    const renderer = jsTestUtils.shallowRender(<Help
      changeState={sinon.stub()}
      displayShortcutsModal={sinon.stub()}
      gisf={false}
      sendGetRequest={sinon.stub()}
      staticURL=""
      user={{user: true}} />, true);
    const output = renderer.getRenderOutput();
    expect(
      output
    ).toEqualJSX(
      <Lightbox
        close={sinon.stub()}
        extraClasses={['help']}>
        <div>
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
                  Read the Juju docs
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
                  onClick={sinon.stub()}
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
                  onClick={sinon.stub()}
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
                  href="https://jujucharms.com/docs/stable/about-juju"
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
      </Lightbox>
    );
  });
});
