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

import StringIO
import json
import unittest

from websocket_replay import (
    Frame,
    NORMAL,
    handle_message,
    infer_direction,
    print_with_color,
    read_frames,
    )


class TestMessageDirectionInference(unittest.TestCase):
    """The infer_direction() function figures out which way a message went."""

    def test_no_request_id(self):
        # If a message has no request ID, then it was sent from the server to
        # the client.
        self.assertEqual('to client', infer_direction({}, set()))

    def test_new_request_id(self):
        # If a message has a request ID, that has not been seen yet, it was
        # sent from the client to the server.
        self.assertEqual(
            'to server',
            infer_direction({'request_id': 1}, set()))

    def test_seen_request_id(self):
        # If a message has a request ID, that has been seen before, it was
        # sent from the server to the client.
        self.assertEqual(
            'to client',
            infer_direction({'request_id': 1}, set([1])))


class TestReadingFrames(unittest.TestCase):
    """Log lines are read and turned into into frames with a direction."""

    def test_reading_junk(self):
        # Junk lines (lines with no JSON-encoded message) are ignored.
        log = """\
            this is junk
            and so is this
            me too!""".split('\n')
        self.assertEqual([], list(read_frames(log)))

    def test_reading_frames(self):
        # Frames interspersed with junk are read correctly.
        log = """\
            this is junk
            {"foo": 1, "bar": 2, "request_id": 42}
            more junk
            {"response": "hi", "request_id": 42}
            the last junk""".split('\n')
        self.assertEqual(
            [Frame(
                message={u'foo': 1, u'bar': 2, u'request_id': 42},
                direction='to server'),
             Frame(
                message={u'response': u'hi', u'request_id': 42},
                direction='to client')],
            list(read_frames(log)))

    def test_result_is_iterator(self):
        # The object returned from read_frames() is an iterator.  This is so
        # we can consume it incrementally without having to keep up with how
        # far we have progressed along the log.
        frames = read_frames('')
        # We test this by asserting that the frames object is its own
        # iterator.
        self.assertTrue(frames, iter(frames))


class TestColorizedPrinting(unittest.TestCase):
    """We can print with pretty colors."""

    def test_output_is_prefixed_with_color(self):
        # The escape sequence to generate the color is output first.
        stream = StringIO.StringIO()
        COLOR = 'some escape sequence'
        print_with_color(COLOR, 'message', out=stream)
        self.assertTrue(stream.getvalue().startswith(COLOR))

    def test_output_includes_strings(self):
        # The string (or strings) provided as *args are included in the
        # output.
        stream = StringIO.StringIO()
        COLOR = 'some escape sequence'
        MESSAGES = ('message1', 'message2')
        print_with_color(COLOR, *MESSAGES, out=stream)
        for message in MESSAGES:
            self.assertIn(message, stream.getvalue())

    def test_color_is_reset_after_message(self):
        # The color is reset to normal after the message is output.
        stream = StringIO.StringIO()
        COLOR = 'some escape sequence'
        print_with_color(COLOR, 'message', out=stream)
        self.assertTrue(stream.getvalue().endswith(NORMAL))


class FauxLogger(object):
    def __init__(self):
        self.logged = []

    def message(self, *args):
        self.logged.append(('message', args))

    def error(self, *args):
        self.logged.append(('error', args))

    def sent(self, *args):
        self.logged.append(('sent', args))

    def received(self, *args):
        self.logged.append(('received', args))



class TestHandlingMessages(unittest.TestCase):
    """When messages come in, we have to figure out a response."""

    def test_expected_message_comes_in(self):
        # When the message recieved from the client was expected, and there
        # are one or more messages that must then be sent to the client, then
        # we send them.
        MESSAGE = {'op': 'something', 'request_id': 42}
        written = []
        log = FauxLogger()
        frames = iter([
            Frame('next 1', 'to client'),
            Frame('next 2', 'to client')])
        handle_message(json.dumps(MESSAGE), frames, written.append,
            expected=Frame(MESSAGE, 'to client'), log=log)
        # The next messages to the client were sent.
        self.assertEqual(written, ['"next 1"', '"next 2"'])

    def test_expected_message_comes_in_but_was_not_provided(self):
        # When no expected message is provided, then next message is read from
        # the frame log and used instead.
        EXPECTED = {'op': 'something', 'request_id': 42}
        MESSAGE = json.dumps(EXPECTED)
        written = []
        log = FauxLogger()
        frames = iter([
            Frame(EXPECTED, 'to server'),
            Frame('next 1', 'to client'),
            Frame('next 2', 'to client')])
        handle_message(MESSAGE, frames, written.append, log=log)
        # The next messages to the client were sent.
        self.assertEqual(written, ['"next 1"', '"next 2"'])

    def test_unexpected_message_comes_in(self):
        # If something other than the expected message comes in, a SystemExit
        # exception is raised and details of the messages are logged.
        MESSAGE={'op': 'something', 'request_id': 42}
        UNEXPECTED = json.dumps(MESSAGE)
        EXPECTED = {'op': 'something else', 'request_id': 'nope'}
        written = []
        log = FauxLogger()
        frames = iter([
            Frame(EXPECTED, 'to server'),
            Frame('next 1', 'to client'),
            Frame('next 2', 'to client')])
        # The program will exit.
        with self.assertRaises(SystemExit):
            handle_message(UNEXPECTED, frames, written.append, log=log)
        # Debugging output is displayed.
        self.assertIn(('error', ('mismatched messages:',)), log.logged)
        self.assertIn(('error', ('\tgot', MESSAGE)), log.logged)
        self.assertIn(('error', ('\texpected', EXPECTED)), log.logged)

    def test_returning_next_expected_message(self):
        # When the frames include expected messages from the client after
        # messages from the server, the next expected message is returned.
        EXPECTED = {'op': 'something', 'request_id': 42}
        MESSAGE = json.dumps(EXPECTED)
        written = []
        log = FauxLogger()
        frames = iter([
            Frame(EXPECTED, 'to server'),
            Frame('next 1', 'to client'),
            Frame('next 2', 'to client'),
            Frame('next expected', 'to server')])
        # The program will exit.
        handle_message(MESSAGE, frames, written.append, log=log)


if __name__ == '__main__':
    unittest.main()
