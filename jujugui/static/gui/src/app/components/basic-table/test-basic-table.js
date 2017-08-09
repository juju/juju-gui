/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('BasicTable', function() {
  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('basic-table', function() { done(); });
  });

  it('can render the table', function() {
    const columns = [{
      title: 'Column 1',
      size: 3,
      classes: ['class1', 'class2']
    }, {
      title: 'Column 2',
      size: 4
    }];
    const rows = [
      ['row 1 column 1', 'row 1 column 2'],
      ['row 2 column 1'],
      ['row 3 column 1', 'row 3 column 2', 'row 3 column 3']
    ];
    const renderer = jsTestUtils.shallowRender(
      <juju.components.BasicTable
        columns={columns}
        rows={rows} />, true);
    const output = renderer.getRenderOutput();
    const expected = (
      <ul className="basic-table twelve-col">
        <li className="twelve-col basic-table__header"
          key={0}>
          <div className="three-col class1 class2"
            key={0}>
            Column 1
          </div>
          <div className="last-col four-col"
            key={1}>
            Column 2
          </div>
        </li>
        <li className="twelve-col basic-table__row"
          key={1}>
          <div className="three-col class1 class2"
            key={0}>
            row 1 column 1
          </div>
          <div className="last-col four-col"
            key={1}>
            row 1 column 2
          </div>
        </li>
        <li className="twelve-col basic-table__row"
          key={2}>
          <div className="three-col class1 class2"
            key={0}>
            row 2 column 1
          </div>
          <div className="last-col four-col"
            key={1}>
          </div>
        </li>
        <li className="twelve-col basic-table__row"
          key={3}>
          <div className="three-col class1 class2"
            key={0}>
            row 3 column 1
          </div>
          <div className="last-col four-col"
            key={1}>
            row 3 column 2
          </div>
        </li>
      </ul>);
    expect(output).toEqualJSX(expected);
  });
});
