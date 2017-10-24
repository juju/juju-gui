# GUI Development

This document contains all of the information necessary to get your development
environment set up for working on the Juju GUI.

## Getting the code

`git clone https://github.com/juju/juju-gui.git`

## Building

The build process is managed by Make and requires a Linux environment to be built
using the automated process. The system dependencies are installed globally, if
you do not want your system modified by this process run it in a container.

> Any POSIX compliant environment can be used however you'll need to manually
install the system dependencies. Those dependencies can be found by reading the
`sysdeps` target in the `Makefile`.

Install Make on the system: `apt install make`.

Install the global system dependencies: `make sysdeps`.

Build the GUI: `make gui`.

## Running

The GUI contains its own asset server and file watchers that can be started by
running: `make run`.

While this server is running any changes made to any of the files in the `/src`
path will trigger a rebuild of the modified files.

In order to actually use the GUI in the development mode you will need to connect
it to a Juju Controller. To do this we use [GUIProxy](https://github.com/juju/guiproxy),
see its Readme for information on how to use and build it.

## Running Tests

The Makefile contains a number of different test targets depending on the
components to be tested. To run the full suite as run by CI: `make check`.

Test targets:
- All: `check`
- JavaScript: `test-js`, `test-js-old`
- Python: `test-python`
- Selenium: `test-selenium`

Lint Targets:
- All: `lint`
- Components: `lint-components`
- CSS: `lint-css`
- JavaScript: `lint-js`
- Python: `lint-python`
