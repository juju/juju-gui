===================
bin/websocketreplay
===================

Capturing and replaying the websocket communication between the GUI and
Juju is a useful debugging tool.  The bin/websocketreplay utility acts
as a Juju API websocket server and plays back recorded logs of websocket
traffic.  It listens on the default Juju API port of 8081 and does not
require running any other Juju backend.


Capturing Websocket Traffic
===========================

Short sequences can be captured from the Chrome (or Chromium) developer
tools.

Follow these instructions *exactly* as written.

 - Open a new tab in Chrome
 - Open the developer tools (Control-Shift-i)
 - Select the “Network” pane
 - Click the “Websockets” filter at the bottom of the pane
 - Navigate to the GUI (e.g., localhost:8888)
 - Perform the actions you want logged.
 - Click on the single “ws” entry on the left of the Network pane.
 - Select the “Frames” tab to the right.
 - Click on the first entry in the frames table.
 - Type Control-a to select all.
 - Open a text editor and middle-click to paste the log.
 - Save the log to a file.

Note: If you are taken to the “Sources” view by a breakpoint being
triggered you need to disable breakpoints by selecting the “Sources”
pane and clicking on the pause symbol in a stop sign at the bottom of
the pane until it is grey (i.e., no stopping on breakpoints).

Unfortunately Chrome does not permit many entries to be stored so we may
capture only short sequences using this technique.  A more sophisticated
traffic logging feature is planned for the GUI.


Replaying Websocket Traffic
===========================

A captured log can be replayed like so::

    bin/websocketreplay FILE

If the GUI makes a request that does not match the traffic in the log
the server raises an exception.


Replaying Python Juju Traffic
-----------------------------

When replaying logs of Python-based Juju, any actions taken by the user
will have to be replicated in order to replay the entire log.


Replaying Go Juju Traffic
-------------------------

As a result of the particular structure of the protocol used by Go-based
Juju replaying logs that contain user actions is difficult.  We hope to
add features to the replay utility that will facilitate such replays.
