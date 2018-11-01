'use strict';

const React = require('react');

const enzyme = require('enzyme');
const JsDiff = require('diff');

assert.compareJSX = function(actual, expected) {
  const actualOutput = actual.debug();
  // If the very first child of a component is another component then this
  // will render that components markup making it impossible to actually
  // compare the two outputs. By wrapping the expected in a div we stop
  // enzyme from rendering the supplied component and then we compare against
  // the actual output.
  const expectedOutput = enzyme
    .shallow(<div>{expected}</div>)
    .children()
    .debug();
  const diff = JsDiff.diffLines(actualOutput, expectedOutput);
  if (!diff.some(part => part.added || part.removed)) {
    return;
  }
  let message = '';
  diff.forEach(part => {
    if (part.added === true) {
      message += `\x1b[32m+ ${part.value}\x1b[0m\n'`;
    } else if (part.removed === true) {
      message += `\x1b[31m- ${part.value}\x1b[0m\n'`;
    } else {
      message += `${part.value}\n`;
    }
  });
  assert.fail(true, false, `The JSX did not match: \n${message}`);
};
