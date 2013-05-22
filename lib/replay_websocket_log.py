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

from __future__ import print_function

import collections
import fileinput
import json
import re
import sys
import time

# XXX This needs to be internationalized.  We can probably just support 12-
# and 24-hour clocks and call it done.
time_regex = re.compile('\d?\d:\d\d:\d\d( AM| PM)?')


def identify(line):
    if line.startswith('{'):
        return 'message'
    elif time_regex.match(line):
        return 'time'
    else:
        return 'junk'


def parse_time(s):
    """"""
    # If the time is 12-hour (ends in "AM" or "PM") then parse it that way.
    if s.endswith('M'):
        return time.strptime(s, '%I:%M:%S %p')
    else:
        return time.strptime(s, '%H:%M:%S')


def parse_message(s):
    return json.loads(s)


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
    # The client is the only side that sends requests that include an ID,
    # therefore if the message contains a request ID that has been seen
    # before, then it is a reply (from the server) to the first message that
    # contained that ID (which was sent by the client).
    if message['request_id'] in seen_request_ids:
        return 'to client'
    else:
        return 'to server'


def read_frames(source):
    """Read frames from an iterable.

    Returns a sequence of named tuples of this form: (direction, time, message).

    direction: either the string "to server" or "to browser" to indicate the
        direction the message was sent
    time: the clock time when the message was seen (a time.struct_time)
    message: the frame payload as a string
    """
    Record = collections.namedtuple('Record', ['direction', 'time', 'message'])

    message = direction = time = None
    seen_request_ids = set()
    for line in source:
        line = line.strip()
        # The data format is a bit icky, but it is regular, so figuring out
        # what kind of data each line represents is straight-forward.
        kind = identify(line)
        if kind == 'message':
            message = parse_message(line)
            direction = infer_direction(message, seen_request_ids)
            if 'request_id' in message:
                seen_request_ids.add(message['request_id'])
        elif kind == 'time':
            time = parse_time(line)
            # When we find a time record we have collected all the data for
            # one record.
            yield Record(direction, time, message)
            message = direction = time = None

expected = None


def serve_frames(frames):
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler

    def websocket_app(environ, start_response):
        global expected
        if environ['PATH_INFO'] == '/ws':
            ws = environ['wsgi.websocket']
            message = ws.receive()
            print('received:', message)
            message = json.loads(message)
            if expected is None:
                expected = frames.next()
#            # First we ensure that the message we were sent matches what
#            # happened in the log.
#            assert message['request_id'] == expected.message['request_id']
#            assert message['op'] == expected.message['op']
            if message['op'] != expected.message['op']:
                print('got', message)
                print('expected', expected.message)
                raise SystemExit
            # Now we send the response.
            while True:
                next_frame = frames.next()
                if next_frame.direction == 'to client':
                    # If the next frame from the log is going to the client,
                    # then send it.
                    print('sent:', next_frame.message)
                    ws.send(json.dumps(next_frame.message))
#                    time.sleep(1)
                else:
                    # Otherwise save it to compare against the next message we
                    # receive from the client.
                    expected = next_frame
                    break
        else:
            print('bad request:', environ['PATH_INFO'])

    server = pywsgi.WSGIServer(("", 8000), websocket_app,
        handler_class=WebSocketHandler)
    server.serve_forever()


def main():
    serve_frames(read_frames(fileinput.input()))


if __name__ == '__main__':
    sys.exit(main())
