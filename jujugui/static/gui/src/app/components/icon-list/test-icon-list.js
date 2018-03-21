/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const IconList = require('./icon-list');

describe('IconList', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <IconList
      applications={options.applications || [{
        displayName: 'mysql',
        iconPath: 'mysql.svg',
        id: 'cs:mysql'
      }, {
        displayName: 'wordpress',
        id: 'cs:wordpress'
      }, {
        displayName: 'django',
        iconPath: 'django.svg',
        id: 'cs:new-series/django'
      }]}
      changeState={options.changeState || sinon.stub()}
      generatePath={sinon.stub().returns('/charm/path')} />
  );

  it('can render', () => {
    const wrapper = renderComponent();
    const links = wrapper.find('.icon-list__link');
    const expected = (
      <ul className="icon-list">
        <li className="icon-list__item tooltip" key="mysql">
          <a className="icon-list__link"
            href="/charm/path"
            onClick={links.at(0).prop('onClick')}>
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
        <li className="icon-list__item tooltip" key="wordpress">
          <a className="icon-list__link"
            href="/charm/path"
            onClick={links.at(1).prop('onClick')}>
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
        <li className="icon-list__item tooltip" key="django">
          <a className="icon-list__link"
            href="/charm/path"
            onClick={links.at(0).prop('onClick')}>
            <img alt='django'
              className="icon-list__image"
              src="django.svg" />
            <span className="tooltip__tooltip">
              <span className="tooltip__inner tooltip__inner--down">
                django
              </span>
            </span>
          </a>
        </li>
      </ul>);
    assert.compareJSX(wrapper, expected);
  });

  it('generates the correct paths', () => {
    const wrapper = renderComponent();
    const generatePath = wrapper.instance().props.generatePath;
    assert.equal(generatePath.callCount, 3);
    const args = generatePath.args;
    assert.deepEqual(args[0], [{profile: null, search: null, store: 'mysql'}]);
    assert.deepEqual(
      args[1], [{profile: null, search: null, store: 'wordpress'}]);
    // It was not possible to get the store state for an unknown series.
    assert.deepEqual(args[2], [{profile: null, search: null, store: null}]);
  });

});
