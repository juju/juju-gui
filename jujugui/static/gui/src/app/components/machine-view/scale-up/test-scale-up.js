/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const shapeup = require('shapeup');

const MachineViewScaleUp = require('./scale-up');
const ButtonRow = require('../../shared/button-row/button-row');

describe('MachineViewScaleUp', function() {
  let acl, dbAPI;

  const renderComponent = (options = {}) => enzyme.shallow(
    <MachineViewScaleUp
      acl={options.acl || acl}
      dbAPI={options.dbAPI || dbAPI}
      toggleScaleUp={options.toggleScaleUp || sinon.stub()} />
  );

  beforeEach(() => {
    acl = shapeup.deepFreeze({isReadOnly: () => false});
    const applications = {
      toArray: sinon.stub().returns([{
        get: function(val) {
          switch (val) {
            case 'id':
              return '111111$';
              break;
            case 'name':
              return 'django';
              break;
            case 'icon':
              return 'data:image/gif;base64,';
              break;
          }
        }
      }, {
        get: function(val) {
          switch (val) {
            case 'id':
              return '222222$';
              break;
            case 'name':
              return 'mysql';
              break;
            case 'icon':
              return 'data:image/gif;base64,';
              break;
          }
        }
      }, {
        // Subordinate applications should not appear in the list.
        get: function(val) {
          switch (val) {
            case 'id':
              return '333333$';
              break;
            case 'name':
              return 'ntp';
              break;
            case 'icon':
              return 'ntp.svg';
              break;
            case 'subordinate':
              return true;
              break;
          }
        }
      }]),
      getById: function(val) {
        switch (val) {
          case '111111$':
            return '111111$';
            break;
          case '222222$':
            return '222222$';
            break;
        }
      }
    };
    dbAPI = {
      addGhostAndEcsUnits: sinon.stub(),
      applications: applications
    };
  });

  it('can render', function() {
    const wrapper = renderComponent();
    const buttons = wrapper.find('ButtonRow').prop('buttons');
    const expected = (
      <form className="machine-view__scale-up"
        onSubmit={wrapper.prop('onSubmit')}>
        <ul className="machine-view__scale-up-units">
          <li className="machine-view__scale-up-unit"
            key="111111$">
            <img alt="django"
              className="machine-view__scale-up-unit-icon"
              src="data:image/gif;base64," />
            <div className="machine-view__scale-up-unit-name"
              title="django">
              django
            </div>
            <input
              className="machine-view__scale-up-unit-input"
              disabled={false}
              min="0"
              placeholder="units"
              ref="scaleUpUnit-111111$"
              step="1"
              type="number" />
          </li>
          <li className="machine-view__scale-up-unit"
            key="222222$">
            <img alt="mysql"
              className="machine-view__scale-up-unit-icon"
              src="data:image/gif;base64," />
            <div className="machine-view__scale-up-unit-name"
              title="mysql">
              mysql
            </div>
            <input
              className="machine-view__scale-up-unit-input"
              disabled={false}
              min="0"
              placeholder="units"
              ref="scaleUpUnit-222222$"
              step="1"
              type="number" />
          </li>
        </ul>
        <ButtonRow buttons={[{
          action: buttons[0].action,
          title: 'Cancel',
          type: 'base'
        }, {
          action: buttons[1].action,
          disabled: false,
          title: 'Add units',
          type: 'neutral'
        }]} />
      </form>);
    assert.compareJSX(wrapper, expected);
  });

  it('can disable controls when read only', function() {
    acl = shapeup.deepFreeze({isReadOnly: () => true});
    const wrapper = renderComponent();
    assert.equal(wrapper.find('ButtonRow').prop('buttons')[1].disabled, true);
  });

  it('can scale applications', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = {
      'scaleUpUnit-111111$': {
        value: '5'
      },
      'scaleUpUnit-222222$': {
        value: '9'
      }
    };
    wrapper.find('ButtonRow').prop('buttons')[1].action();
    const addGhostAndEcsUnits = dbAPI.addGhostAndEcsUnits;
    assert.equal(addGhostAndEcsUnits.callCount, 2);
    assert.equal(addGhostAndEcsUnits.args[0][0], '111111$');
    assert.equal(addGhostAndEcsUnits.args[0][1], '5');
    assert.equal(addGhostAndEcsUnits.args[1][0], '222222$');
    assert.equal(addGhostAndEcsUnits.args[1][1], '9');
  });

  it('can scale applications with dashes in the name', () => {
    const applications = {
      toArray: sinon.stub().returns([{
        get: function(val) {
          switch (val) {
            case 'id':
              return 'juju-gui';
              break;
            case 'name':
              return 'juju-gui';
              break;
            case 'icon':
              return 'data:image/gif;base64,';
              break;
          }
        }
      }]),
      getById: function(val) {
        return 'juju-gui';
      }
    };
    dbAPI.applications = applications;
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.refs = {
      'scaleUpUnit-111111$': {
        value: '5'
      }
    };
    wrapper.find('ButtonRow').prop('buttons')[1].action();
    const addGhostAndEcsUnits = dbAPI.addGhostAndEcsUnits;
    assert.equal(addGhostAndEcsUnits.callCount, 1);
    assert.equal(addGhostAndEcsUnits.args[0][0], 'juju-gui');
    assert.equal(addGhostAndEcsUnits.args[0][1], '5');
  });
});
