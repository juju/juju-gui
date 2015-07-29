#!/usr/bin/env python
# This file is part of the Juju GUI, which lets users view and manage Juju
# environments within a graphical interface (https://launchpad.net/juju-gui).
# Copyright (C) 2012-2013 Canonical Ltd.
#
# This program is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License version 3, as published by
# the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
# SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

"""This module implements a websocket server that replays logs.

It runs on the same port as the default for Juju and is used in place of ether
the Python or Go versions of Juju.  User docs are in
docs/recording-and-playing-back-websocket-traffic.rst.
"""

from __future__ import print_function

import collections
import fileinput
import json
import re
import sys
import time
import tornado.ioloop
import tornado.web
import tornado.websocket


HELP = """\
Usage: bin/websocketreplay FILE

Replay a log of websocket traffic (FILE) between the GUI and a backend
(py-juju-only for the moment).

See docs/recording-and-playing-back-websocket-traffic.rst for details."""


RED = '\x1b[31m'
GREEN = '\x1b[32m'
BLUE = '\x1b[34m'
NORMAL = '\x1b[0m'


def infer_direction(message, seen_request_ids):
    """Figure out if this message was sent to the client or to the server.

    The data we have does not include directionality (i.e., was this frame
    send from the browser to the server, or vice versa).  Therefore we
    reconstruct the direction through our knowlege of the protocol.
    """
    # The client always includes a request ID, so if the message does not have
    # one, then the server sent it.
    if 'request_id' not in message:
        return 'to client'
    # Responses to requests include the request ID of the original message.
    # The client is the only side that originates requests that include an ID.
    # Therefore, if the message contains a request ID that has been seen
    # before, then it is a reply (from the server) to the first message that
    # contained that ID (which was sent by the client).
    if message['request_id'] in seen_request_ids:
        return 'to client'
    else:
        return 'to server'


Frame = collections.namedtuple('Frame', ['message', 'direction'])


def read_frames(source):
    """Read frames from an iterable.

    Returns a sequence of named tuples of the form (message, direction).

    message: the frame payload as a mapping
    direction: either the string "to server" or "to browser" to indicate the
        direction the message was sent
    """
    seen_request_ids = set()
    direction = None
    for line in source:
        line = line.strip()
        # The data format is a bit icky, but since we only send json-encoded
        # messages, pulling them out of the log is straight-forward.
        if line.startswith('to '):
            direction = line
        elif line.startswith('{'):
            message = json.loads(line)
            # If the log does not contain direction info we have to guess.
            if direction is None:
                direction = infer_direction(message, seen_request_ids)
            if 'request_id' in message:
                seen_request_ids.add(message['request_id'])
            yield Frame(message, direction)
            message = direction = None


def print_with_color(color, *args, **kws):
    """Display a message in the given color."""
    out = kws.get('out', sys.stdout)
    print(color, end='', file=out)
    try:
        print(*args, file=out)
    finally:
        # Reset the color so subsequent output is not accidentally colorized.
        print(NORMAL, end='', file=out)
        out.flush()


class Logger(object):

    @staticmethod
    def message(*args):
        print(*args)

    @staticmethod
    def error(*args):
        print_with_color(RED, 'error:', *args)

    @staticmethod
    def sent(*args):
        print_with_color(GREEN, 'sent:', *args)

    @staticmethod
    def received(*args):
        print_with_color(BLUE, 'received:', *args)


def handle_message(message, frames, write_message, expected=None, log=Logger):
    """Respond to an incoming message with one or more replayed messages.

    message: the message received from the client
    frames: an iterator of logged frames
    write_message: a function that will send a message to the client
    expected: the message that we expect to see next from the client
    log: an object that knows how to display various kinds of messages
    """
    log.received(message)
    message = json.loads(message)
    # If we do not know what message to expect, pull the next message from the
    # frame log and expect it.
    if expected is None:
        try:
            expected = frames.next()
        except StopIteration:
            # If we are at the end of the logged frames, there isn't anything
            # to do other than ignore any incoming messages.
            log.message('reached end of log, ignoring incoming frames')
            return

    # First we ensure that the message we were sent matches what happens next
    # in the log.
    ops_match = message['op'] == expected.message['op']
    ids_match = message['request_id'] == expected.message['request_id']
    if not (ops_match and ids_match):
        log.error('mismatched messages:')
        log.error('\tgot', message)
        log.error('\texpected', expected.message)
        # Things have gone so bad we should just stop now.
        raise SystemExit

    # Loop as long as there are frames to send to the client.
    while True:
        try:
            next_frame = frames.next()
        except StopIteration:
            # That is the end of the log, we'll just accept messages and
            # maintain radio silence from this point on.
            log.message('reached end of log, ignoring incoming frames')
            return

        if next_frame.direction == 'to client':
            # If the next frame from the log is going to the client, send it.
            log.sent(next_frame.message)
            write_message(json.dumps(next_frame.message))
        else:
            # Otherwise return it and it will be passed in as the next
            # "expected" frame when the next message arrives from the client.
            return next_frame


class WSHandler(tornado.websocket.WebSocketHandler):
    """Handle websocket messages with our handle_message function."""

    done = False
    expected = None

    def __init__(self, *args):
        super(WSHandler, self).__init__(*args)
        self.frames = read_frames(fileinput.input())

    def open(self):
        print('connection opened...')

    def on_message(self, message):
        # Handle the incoming message, storing the next message we expect to
        # see for later use.
        self.expected = handle_message(message, self.frames,
            self.write_message, self.expected)

    def on_close(self):
        print('connection closed...')


application = tornado.web.Application([(r'/ws', WSHandler)])


def main(argv):
    if len(argv) < 2 or '--help' in argv[1:] or '-h' in argv[1:]:
        print(HELP)
        return 0

    application.listen(8081)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    sys.exit(main(sys.argv))
