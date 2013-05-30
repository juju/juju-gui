==========
Unit Tests
==========

The JUJU GUI project uses the `mocha.js`__ test framework for its unit tests.
As the application complexity grows there are a number of 'gotchas' in the
application which can result in huge headaches when trying to write or modify
the unit tests. This document is the go-to resource to document these and should
be read thoroughly before you modify or write additional tests.

__ http://visionmedia.github.io/mocha/

noop app.navigate() when instantiating app
------------------------------------------

Because the login system now automatically dispatches depending on the users
credentials, saved or otherwise, navigate() needs to be noop'ed when
instantiating app to stop it from navigating during tests::

	app.navigate = function() {};
