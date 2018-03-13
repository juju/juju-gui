'use strict';

const enzyme = require('enzyme');
const JsDiff = require('diff');

var assert = chai.assert;
assert.compareJSX = function(actual, expected) {
  const actualOutput = actual.debug();
  const expectedOutput = enzyme.shallow(expected).debug();
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
