
'use strict';

// Validate prop type errors.

beforeEach(function() {
  spyOn(console, 'error').and.callThrough(); // eslint-disable-line no-undef
});

afterEach(function() {
  console.error.calls.all().forEach(call => {
    let error = call.args[0];
    if (!error) {
      return;
    }
    if (error.toString) {
      // This must be a raised Error().
      error = error.toString();
    }
    if (error.startsWith('Warning: Failed prop type:')) {
      fail(`\x1b[31m${error}\x1b[0m'`);
    }
  });
});
