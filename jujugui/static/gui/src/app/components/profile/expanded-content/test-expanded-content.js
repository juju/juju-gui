/* Copyright (C) 2017 Canonical Ltd. */

'use strict';
const React = require('react');

const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
const ProfileExpandedContent = require('../expanded-content/expanded-content');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('Profile expanded content', function() {

  const rawBundleData = `{
    "bugUrl": "example.com/bugs",
    "description": "logstash-core description",
    "homepage": "example.com/",
    "id": "cs:~lazypower/bundle/logstash-core-1",
    "perm": {
      "read": ["everyone"],
      "write": ["lazypower"]
    },
    "applications": {
      "elasticsearch": {
        "charm": "cs:~lazypower/trusty/elasticsearch"
      },
      "kibana": {
        "charm": "cs:trusty/kibana-10"
      },
      "logstash": {
        "charm": "cs:~lazypower/trusty/logstash-20"
      },
      "openjdk": {
        "charm": "cs:~kwmonroe/trusty/openjdk"
      }
    },
    "name": "logstash-core",
    "machineCount": 2,
    "unitCount": 3
  }`;
  const rawCharmData = `{
    "bugUrl": "example.com/bugs",
    "description": "failtester description",
    "homepage": "example.com/",
    "id": "cs:~hatch/precise/failtester-7",
    "series": ["precise"],
    "perm": {
      "read": ["everyone", "hatch"],
      "write": ["hatch"]
    },
    "name": "failtester"
  }`;

  function renderComponent(options={}) {
    const entity = JSON.parse(options.entity);
    return jsTestUtils.shallowRender(
      <ProfileExpandedContent
        changeState={options.changeState || sinon.stub()}
        entity={entity}
        getDiagramURL={options.getDiagramURL || sinon.stub().returns('diagram.svg')}
        topRow={options.topRow || (<div>Top row</div>)} />, true);
  }

  it('can render for a bundle', () => {
    const renderer = renderComponent({
      entity: rawBundleData
    });
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-expanded-content">
        <div>Top row</div>
        <div className="six-col">
          <p>logstash-core description</p>
          <EntityContentDiagram
            diagramUrl="diagram.svg" />
        </div>
        <div className="six-col last-col">
          <div>
            <a href="example.com/bugs"
              onClick={sinon.stub()}
              target="_blank">
              Bugs
            </a>
          </div>
          <div>
            <a href="example.com/"
              onClick={sinon.stub()}
              target="_blank">
              Homepage
            </a>
          </div>
          <p className="profile-expanded-content__permissions-title">
            Writeable:
          </p>
          <ul className="profile-expanded-content__permissions">
            <li className="profile-expanded-content__permission link"
              onClick={sinon.stub()}
              role="button"
              tabIndex="0">
              lazypower
            </li>
          </ul>
          <p className="profile-expanded-content__permissions-title">
            Readable:
          </p>
          <ul className="profile-expanded-content__permissions">
            <li className="profile-expanded-content__permission">
              everyone
            </li>
          </ul>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render for a charm', () => {
    const renderer = renderComponent({
      entity: rawCharmData
    });
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-expanded-content">
        <div>Top row</div>
        <div className="six-col">
          <p>failtester description</p>
          <EntityContentDiagram
            diagramUrl="diagram.svg" />
        </div>
        <div className="six-col last-col">
          <div>
            <a href="example.com/bugs"
              onClick={sinon.stub()}
              target="_blank">
              Bugs
            </a>
          </div>
          <div>
            <a href="example.com/"
              onClick={sinon.stub()}
              target="_blank">
              Homepage
            </a>
          </div>
          <p className="profile-expanded-content__permissions-title">
            Writeable:
          </p>
          <ul className="profile-expanded-content__permissions">
            <li className="profile-expanded-content__permission link"
              onClick={sinon.stub()}
              role="button"
              tabIndex="0">
              hatch
            </li>
          </ul>
          <p className="profile-expanded-content__permissions-title">
            Readable:
          </p>
          <ul className="profile-expanded-content__permissions">
            <li className="profile-expanded-content__permission">
              everyone
            </li>
            <li className="profile-expanded-content__permission link"
              onClick={sinon.stub()}
              role="button"
              tabIndex="0">
              hatch
            </li>
          </ul>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });
});
