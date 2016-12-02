## Juju GUI State

The State module for the Juju GUI maps the internal representation of the
application directly to the url to enable easy sharing of the view the user
is looking at.

When the application initially loads the state system must be first 'dispatched'
which will tell state to grab the current path, and then execute the matching
dispatchers to render the application into the correct state. New dispatchers
can be registered at any time and changes to the state must be done by calling
the `changeState` method.

State maintains a history of all of the state changes throughout the life of
the application accesible via the `history` propery.

### How to use

#### To create a new instance of State
An application will only have a single instance of state and this instance
will handle parsing the paths, updating the application state and updating
the browser history.

```JavaScript
const state = new State({
  baseURL: 'http://example.com:8080',
  seriesList: ['trusty', 'xenial'],
  location: {href: '/i/machines/inspector/relations'},
  history: { pushState: () => {} }
});
```
##### Required Parameters:
- `baseURL` - the root path that the gui is being served from. This can be only
  the host:port or optionally include a base path such as:
  http://example.com:8080, http://example.com/gui
- `seriesList` - A master list of all of the supported series that you'd like the
  GUI to match with when parsing charmstore urls.

##### Optional Parameters:
- `location` - A custom location object to avoid using the window
  location. Typically used for testing purposes.
- `history` - A custom history object that the state system will execute the
  push and popstate commands on. Typically used for testing purposes.


#### Registering dispatchers
In order for state to respond to state changes dispatchers need to be registered
which will be called when state is dispatched and the dispatchers path matches
the existing state.

```JavaScript
state.register([
  ['*', baseRouteHandler],
  ['gui', showGUI, teardownGUI],
  ['gui.machines', showGUIMachines, teardownGUIMachines]
]);
```

The `register` method takes a single Array argument which contains Array records
of the `state path`, `create dispatcher`, and `teardown dispatcher`. When the
state object has a matching path it will execute the matching
'create dispatchers'. These dispatcher methods will be called with two
arguments. The first being the existing application state and the second a next
method that must be called for dispatching to continue. If this next method is
not called then dispatching will stop executing. As an example this can be used
to prevent a user from using the application if they are not authenticated.

To illustrate how state parses an application state, take the following state
object as an example:

```JavaScript
{gui: {machines: ''}}
```

The state system will:
1. Run the `baseRouteHandler` as the `state path` with an asteriks will be
   executed every time the state dispatches.
2. Run `showGUIMachines` as it's the next route which fully matches the
   object paths in state. Note that `showGUI` is not run here as there is a
   fully qualified matching dispatcher.

If there are no matching dispatchers for a complex state the state system will
try to find the closest matching state. Take the following setup as an
example:

```JavaScript
state.register([
  ['gui.inspector', showInspector]
]);
// Application state.
{gui: {inspector: {id: ''}}}
```

The state system will:
1. Look for a matching dispatcher for `gui.inspector.id`.
2. If it didn't find one, it'll remove the last section of the path resulting in
   `gui.inspector` and look again. It will continue this way until a
   dispatcher is found, or the path ends up being empty.

The `teardown dispatcher` will be called when a state path has been nullified.
See [Changing the application state](#Changing the application state)

#### Dispatching the applications
After you have created a new state instance and registered dispatchers you will
want the state system to parse the browser path and execute the dispatchers
which match. This is done with the `dispatch` method.

```JavaScript
state.dispatch();
```

You will likely only ever want to call this method once after the application
has been fully instantiated. Or if an external process has updated the browser
path and you'd like the application state to represent this new state.

#### Changing the application state
Once the application has been fully instantiated, dispatchers registered and
state dispatched you'll then want to update the application state based on
user interactions. This is done with the `changeState` method.

```JavaScript
state.changeState({
  store: null,
  gui: {
    machines: '',
    inspector: {id: 'mysql'}
  }
});
```

The state system will:
1. Merge your supplied state with the existing application state.
2. Remove records from state with a `null` value.
3. Create a new record in the application state history.
4. Push the new state into the path of the browser.
5. Dispatch the application so that the UI matches the state.

To trigger the `teardown dispatcher` that is registered with a path this path
must be nulled out. This is done by setting the path to null.

```JavaScript
state.register([
  ['gui.machines', showGUIMachines, teardownGUIMachines]
]);

state.changeState({
  gui: {
    machines: null
  }
});
```

In the above example the `gui.machines` path has been set to null so the
`teardownGUIMachines` method will be called.

#### Getting the current application state
The application state can be retrieved from three places

- `state.current` - This will return the current application state and is
  available anywhere you have access to the state instance.
- `dispatcher(state, next)` - While state is executing the dispatchers, both the
  create and teardown dispatchers are called with the same arugment signature.
  the first being the current application state.
- `state.history` - This is an Array on the state instance which
  holds all changes to the state over the lifecycle of the application.

#### State reserved words, delimiters and state.
The state system assumes a strict adherance to a defined url and state spec.
This spec is best understood by reading the tests associated with the state
system.

The url is divided into three main groups: [Model][Store][UI] and as such have
delimiters associated with each path. These delimiters are defined at the top
of the state.js file. This list also includes a number of reserved words which
are required for basic operation of the GUI and as such are blocked from being
the names of charms and bundles.

The state object is then parsed into these groups and then sub groups within.
The top level of the state object is divided up by the primary groups and then
the sub groups below. Example:

```JavaScript
{
  root: 'login',
  store: 'u/hatch/ghost',
  search: 'apache2'
  gui: {
    machines: '',
    inspector: {
      unit: '2'
    }
  }
}
```
