/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

// Validate prop type errors.

beforeEach(function() {
  spyOn(console, 'error').and.callThrough(); // eslint-disable-line no-undef
});

afterEach(function() {
  console.error.calls.all().forEach(call => {
    const error = call.args[0];
    if (error && error.startsWith('Warning: Failed prop type:')) {
      fail(`\x1b[31m${error}\x1b[0m'`);
    }
  });
});
