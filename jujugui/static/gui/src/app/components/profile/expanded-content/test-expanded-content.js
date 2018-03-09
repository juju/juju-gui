/* Copyright (C) 2017 Canonical Ltd. */

'use strict';
const React = require('react');
const shapeup = require('shapeup');

const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');
const GenericButton = require('../../generic-button/generic-button');
const Link = require('../../link/link');
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
  const rawCharmDataWithoutEntityDesc = `{
    "bugUrl": "example.com/bugs",
    "homepage": "example.com/",
    "id": "cs:~hatch/precise/failtester-7",
    "series": ["precise"],
    "perm": {
      "read": ["everyone", "hatch"],
      "write": ["hatch"]
    },
    "name": "failtester"
  }`;
  let acl;

  beforeEach(() => {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
  });

  function renderComponent(options={}) {
    const entity = JSON.parse(options.entity);
    return jsTestUtils.shallowRender(
      <ProfileExpandedContent
        acl={options.acl || acl}
        addToModel={options.addToModel || sinon.stub()}
        changeState={options.changeState || sinon.stub()}
        entity={entity}
        generatePath={options.generatePath || sinon.stub()}
        getDiagramURL={options.getDiagramURL || sinon.stub().returns('diagram.svg')}
        getModelName={options.getModelName || sinon.stub().returns('snazzy-model')}
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
          <p className="profile-expanded-content__entity-desc">logstash-core description</p>
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
            <li className="profile-expanded-content__permission"
              key="lazypower">
              <Link changeState={sinon.stub()}
                clickState={{
                  hash: null,
                  profile: 'lazypower'
                }}
                generatePath={sinon.stub()}>
                lazypower
              </Link>
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
        <div className="three-col prepend-nine last-col">
          <GenericButton
            action={sinon.stub()}
            disabled={false}
            tooltip="Add this bundle to your current model"
            type="positive">
            Add to snazzy-model
          </GenericButton>
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
          <p className="profile-expanded-content__entity-desc">failtester description</p>
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
            <li className="profile-expanded-content__permission"
              key="hatch">
              <Link changeState={sinon.stub()}
                clickState={{
                  hash: null,
                  profile: 'hatch'
                }}
                generatePath={sinon.stub()}>
                hatch
              </Link>
            </li>
          </ul>
          <p className="profile-expanded-content__permissions-title">
            Readable:
          </p>
          <ul className="profile-expanded-content__permissions">
            <li className="profile-expanded-content__permission">
              everyone
            </li>
            <li className="profile-expanded-content__permission"
              key="hatch">
              <Link changeState={sinon.stub()}
                clickState={{
                  hash: null,
                  profile: 'hatch'
                }}
                generatePath={sinon.stub()}>
                hatch
              </Link>
            </li>
          </ul>
        </div>
        <div className="three-col prepend-nine last-col">
          <GenericButton
            action={sinon.stub()}
            disabled={false}
            tooltip="Add this bundle to your current model"
            type="positive">
            Add to snazzy-model
          </GenericButton>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render for a charm without entity description', () => {
    const renderer = renderComponent({
      entity: rawCharmDataWithoutEntityDesc
    });
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-expanded-content">
        <div>Top row</div>
        <div className="six-col">
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
            <li className="profile-expanded-content__permission"
              key="hatch">
              <Link changeState={sinon.stub()}
                clickState={{
                  hash: null,
                  profile: 'hatch'
                }}
                generatePath={sinon.stub()}>
                hatch
              </Link>
            </li>
          </ul>
          <p className="profile-expanded-content__permissions-title">
            Readable:
          </p>
          <ul className="profile-expanded-content__permissions">
            <li className="profile-expanded-content__permission">
              everyone
            </li>
            <li className="profile-expanded-content__permission"
              key="hatch">
              <Link changeState={sinon.stub()}
                clickState={{
                  hash: null,
                  profile: 'hatch'
                }}
                generatePath={sinon.stub()}>
                hatch
              </Link>
            </li>
          </ul>
        </div>
        <div className="three-col prepend-nine last-col">
          <GenericButton
            action={sinon.stub()}
            disabled={false}
            tooltip="Add this bundle to your current model"
            type="positive">
            Add to snazzy-model
          </GenericButton>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can render for a charm without bug/home links', () => {
    const rawCharmData = `{
      "id": "cs:~hatch/precise/failtester-7",
      "series": ["precise"],
      "perm": {
        "read": ["everyone", "hatch"],
        "write": ["hatch"]
      },
      "name": "failtester"
    }`;
    const renderer = renderComponent({
      entity: rawCharmData
    });
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-expanded-content">
        <div>Top row</div>
        <div className="six-col">
          <EntityContentDiagram
            diagramUrl="diagram.svg" />
        </div>
        <div className="six-col last-col">
          <p className="profile-expanded-content__permissions-title">
            Writeable:
          </p>
          <ul className="profile-expanded-content__permissions">
            <li className="profile-expanded-content__permission"
              key="hatch">
              <Link changeState={sinon.stub()}
                clickState={{
                  hash: null,
                  profile: 'hatch'
                }}
                generatePath={sinon.stub()}>
                hatch
              </Link>
            </li>
          </ul>
          <p className="profile-expanded-content__permissions-title">
            Readable:
          </p>
          <ul className="profile-expanded-content__permissions">
            <li className="profile-expanded-content__permission">
              everyone
            </li>
            <li className="profile-expanded-content__permission"
              key="hatch">
              <Link changeState={sinon.stub()}
                clickState={{
                  hash: null,
                  profile: 'hatch'
                }}
                generatePath={sinon.stub()}>
                hatch
              </Link>
            </li>
          </ul>
        </div>
        <div className="three-col prepend-nine last-col">
          <GenericButton
            action={sinon.stub()}
            disabled={false}
            tooltip="Add this bundle to your current model"
            type="positive">
            Add to snazzy-model
          </GenericButton>
        </div>
      </div>);
    expect(output).toEqualJSX(expected);
  });

  it('can deploy an entity', () => {
    const changeState = sinon.stub();
    const addToModel = sinon.stub();
    const renderer = renderComponent({
      changeState: changeState,
      addToModel: addToModel,
      entity: rawBundleData
    });
    const output = renderer.getRenderOutput();
    output.props.children[3].props.children.props.action();
    assert.equal(addToModel.callCount, 1);
    assert.equal(addToModel.args[0][0], 'cs:~lazypower/bundle/logstash-core-1');
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      hash: null,
      profile: null
    });
  });
});
