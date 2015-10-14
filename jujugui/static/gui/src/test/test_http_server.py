# This file is part of the Juju GUI, which lets users view and manage Juju
# environments within a graphical interface (https://launchpad.net/juju-gui).
# Copyright (C) 2013 Canonical Ltd.
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

import os
import unittest
import shutil
import tempfile

from http_server import RewritingHTTPRequestHandler
from SimpleHTTPServer import SimpleHTTPRequestHandler


def noop(*args, **kws):
    pass


def fake_do_GET(self):
    return self.path


class FakeRequest:
    def __init__(self, path):
        self.path = path


class TestRequestHandler(unittest.TestCase):
    """The RewritingHTTPRequestHandler."""

    def setUp(self):
        self.addr = ('0.0.0.0', 9999)
        # Monkey-patch SimpleHTTPRequestHandler.do_GET.
        self.real_do_GET = SimpleHTTPRequestHandler.do_GET
        self.real_setup = RewritingHTTPRequestHandler.setup
        self.real_handle = RewritingHTTPRequestHandler.handle
        self.real_finish = RewritingHTTPRequestHandler.finish
        SimpleHTTPRequestHandler.do_GET = fake_do_GET
        RewritingHTTPRequestHandler.setup = noop
        RewritingHTTPRequestHandler.handle = noop
        RewritingHTTPRequestHandler.finish = noop
        self.dir = os.getcwd()
        self.tempdir = tempfile.mkdtemp()
        os.chdir(self.tempdir)

    def tearDown(self):
        SimpleHTTPRequestHandler.do_GET = self.real_do_GET
        RewritingHTTPRequestHandler.setup = self.real_setup
        RewritingHTTPRequestHandler.handle = self.real_handle
        RewritingHTTPRequestHandler.finish = self.real_finish
        os.chdir(self.dir)
        shutil.rmtree(self.tempdir)

    def test_valid_file(self):
        # Can serve up an existing file.
        with open('somefile.html', 'w'):
            req = FakeRequest('/somefile.html')
            handler = RewritingHTTPRequestHandler(req, self.addr, None)
            handler.path = req.path
            resp = handler.do_GET()
            self.assertEqual('/somefile.html', resp)

    def test_invalid_file(self):
        # If the file does not exist, /index.html is returned.
        req = FakeRequest('/missingfile.html')
        handler = RewritingHTTPRequestHandler(req, self.addr, None)
        handler.path = req.path
        resp = handler.do_GET()
        self.assertEqual('/index.html', resp)

    def test_valid_path(self):
        # Can serve up an existing path.
        subdir = tempfile.mkdtemp(dir=self.tempdir)
        dirname = os.path.split(subdir)[-1]
        fn = os.path.join(dirname, 'somefile.html')
        with open(fn, 'w'):
            path = '/' + fn
            req = FakeRequest(path)
            handler = RewritingHTTPRequestHandler(req, self.addr, None)
            handler.path = req.path
            resp = handler.do_GET()
            self.assertEqual(path, resp)

    def test_invalid_path(self):
        # If the path does not exist, /index.html is returned.
        subdir = tempfile.mkdtemp(dir=self.tempdir)
        dirname = os.path.split(subdir)[-1]
        fn = os.path.join(dirname, 'missingfile.html')
        path = '/' + fn
        req = FakeRequest(path)
        handler = RewritingHTTPRequestHandler(req, self.addr, None)
        handler.path = req.path
        resp = handler.do_GET()
        self.assertEqual('/index.html', resp)


if __name__ == '__main__':
    unittest.main()
