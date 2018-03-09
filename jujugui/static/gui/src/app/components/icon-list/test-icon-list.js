/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const IconList = require('./icon-list');

const jsTestUtils = require('../../utils/component-test-utils');

describe('IconList', function() {

  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
      <IconList
        applications={options.applications || [{
          displayName: 'mysql',
          iconPath: 'mysql.svg',
          id: 'cs:mysql'
        }, {
          displayName: 'wordpress',
          id: 'cs:wordpress'
        }]}
        changeState={options.changeState || sinon.stub()}
        generatePath={
          options.generatePath || sinon.stub().returns('/charm/path')} />, true);
  }

  it('can render', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="icon-list">
        <li className="icon-list__item tooltip"
          key="mysql">
          <a className="icon-list__link"
            href="/charm/path"
            onClick={sinon.stub()}>
            <img alt='mysql'
              className="icon-list__image"
              src="mysql.svg" />
            <span className="tooltip__tooltip">
              <span className="tooltip__inner tooltip__inner--down">
                mysql
              </span>
            </span>
          </a>
        </li>
        <li className="icon-list__item tooltip"
          key="wordpress">
          <a className="icon-list__link"
            href="/charm/path"
            onClick={sinon.stub()}>
            <img alt='wordpress'
              className="icon-list__image"
              src="static/gui/build/app/assets/images/non-sprites/charm_160.svg" />
            <span className="tooltip__tooltip">
              <span className="tooltip__inner tooltip__inner--down">
                wordpress
              </span>
            </span>
          </a>
        </li>
      </ul>);
    expect(output).toEqualJSX(expected);
  });
});
