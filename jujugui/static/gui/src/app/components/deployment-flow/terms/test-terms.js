/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('DeploymentTerms', function() {
  let acl, applications, charmsGetById, getAgreements, showTerms, terms;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('deployment-terms', function() { done(); });
  });

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
    applications = [
      {get: sinon.stub().returns('wordpress')},
      {get: sinon.stub().returns('mysql')},
      {get: sinon.stub().returns('wordpress')}
    ];
    charmsGetById = sinon.stub();
    charmsGetById.withArgs('wordpress').returns({
      get: sinon.stub().returns(['wordpress-terms'])
    });
    charmsGetById.withArgs('mysql').returns({
      get: sinon.stub().returns(['mysql-terms', 'general-terms'])
    });
    getAgreements = sinon.stub().callsArgWith(0, null, [
      {term: 'general-terms'}
    ]);
    showTerms = sinon.stub();
    showTerms.withArgs('wordpress-terms').callsArgWith(2, null, {
      name: 'wordpress-terms',
      content: 'Wordpress terms.'
    });
    showTerms.withArgs('mysql-terms').callsArgWith(2, null, {
      name: 'mysql-terms',
      content: 'Mysql terms.'
    });
    terms = [{
      name: 'wordpress-terms',
      content: 'Wordpress terms.'
    }, {
      name: 'mysql-terms',
      content: 'Mysql terms.'
    }];
  });

  it('can display a loading spinner', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentTerms
        acl={acl}
        charmsGetById={charmsGetById}
        getAgreements={sinon.stub()}
        applications={applications}
        setTerms={sinon.stub()}
        showTerms={sinon.stub()}
        terms={terms} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="deployment-terms__loading">
        <juju.components.Spinner />
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can load terms', function() {
    const setTerms = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentTerms
        acl={acl}
        charmsGetById={charmsGetById}
        getAgreements={getAgreements}
        applications={applications}
        setTerms={setTerms}
        showTerms={showTerms}
        terms={[]} />, true);
    renderer.getRenderOutput();
    assert.equal(setTerms.callCount, 3);
    assert.deepEqual(setTerms.args[0][0], []);
    assert.deepEqual(setTerms.args[1][0], [{
      name: 'wordpress-terms',
      content: 'Wordpress terms.'
    }]);
    assert.deepEqual(setTerms.args[2][0], [{
      name: 'mysql-terms',
      content: 'Mysql terms.'
    }]);
  });

  it('can render terms', function() {
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentTerms
        acl={acl}
        charmsGetById={charmsGetById}
        getAgreements={getAgreements}
        applications={applications}
        setTerms={sinon.stub()}
        showTerms={showTerms}
        terms={terms} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div>
        <ul className="deployment-flow__terms-list">
          <li className="deployment-flow__terms-item"
            key="wordpress-terms">
            <pre>
              Wordpress terms.
            </pre>
          </li>
          <li className="deployment-flow__terms-item"
            key="mysql-terms">
            <pre>
              Mysql terms.
            </pre>
          </li>
        </ul>
        <div className="deployment-flow__deploy-option">
          <input className="deployment-flow__deploy-checkbox"
            disabled={false}
            id="terms"
            type="checkbox" />
          <label className="deployment-flow__deploy-label"
            htmlFor="terms">
            I agree lorem ipsum.
          </label>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });

  it('can disable controls when read only', function() {
    acl.isReadOnly = sinon.stub().returns(true);
    const renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentTerms
        acl={acl}
        charmsGetById={charmsGetById}
        getAgreements={getAgreements}
        applications={applications}
        setTerms={sinon.stub()}
        showTerms={showTerms}
        terms={terms} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <div>
        <ul className="deployment-flow__terms-list">
          <li className="deployment-flow__terms-item"
            key="wordpress-terms">
            <pre>
              Wordpress terms.
            </pre>
          </li>
          <li className="deployment-flow__terms-item"
            key="mysql-terms">
            <pre>
              Mysql terms.
            </pre>
          </li>
        </ul>
        <div className="deployment-flow__deploy-option">
          <input className="deployment-flow__deploy-checkbox"
            disabled={true}
            id="terms"
            type="checkbox" />
          <label className="deployment-flow__deploy-label"
            htmlFor="terms">
            I agree lorem ipsum.
          </label>
        </div>
      </div>);
    assert.deepEqual(output, expected);
  });


  it('should load the terms again if the apps change', function() {
    let renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentTerms
        acl={acl}
        charmsGetById={charmsGetById}
        getAgreements={getAgreements}
        applications={applications}
        setTerms={sinon.stub()}
        showTerms={showTerms}
        terms={terms} />, true);
    renderer.getRenderOutput();
    assert.deepEqual(getAgreements.callCount, 1);
    renderer = renderer.render(
      <juju.components.DeploymentTerms
        acl={acl}
        charmsGetById={charmsGetById}
        getAgreements={getAgreements}
        applications={[
          {get: sinon.stub().returns('wordpress')},
          {get: sinon.stub().returns('mysql')},
          {get: sinon.stub().returns('django')}
        ]}
        setTerms={sinon.stub()}
        showTerms={showTerms}
        terms={terms} />, true);
    assert.deepEqual(getAgreements.callCount, 2);
  });

  it('will abort the requests when unmounting', function() {
    const abort = sinon.stub();
    getAgreements.returns({abort: abort});
    let renderer = jsTestUtils.shallowRender(
      <juju.components.DeploymentTerms
        acl={acl}
        charmsGetById={charmsGetById}
        getAgreements={getAgreements}
        applications={applications}
        setTerms={sinon.stub()}
        showTerms={showTerms}
        terms={terms} />, true);
    renderer.unmount();
    assert.deepEqual(abort.callCount, 1);
  });
});
