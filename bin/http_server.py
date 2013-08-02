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

# A very simple HTTP server that serves the current directory but instead of
# returning a 404 when a path is not found it returns ./index.html.  This is
# used for running the Juju GUI debug and prod servers and still allowing
# namespaces and feature flags to be directly entered.  Feature flags will be
# honored by the web app while namespaces will cause the root URL.

import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
import os.path
import urlparse


class RewritingHTTPRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Remove the query part if required, and translate the URL path into a
        # relative file system path.
        fpath = urlparse.urlsplit(self.path).path[1:]
        # Should the directly entered URL path not map directly to a file on
        # the file system then simply return '/index.html' and keep going.
        if not os.path.exists(fpath):
            self.path = '/index.html'
        return SimpleHTTPRequestHandler.do_GET(self)


# Main entry point.  It defers to the 'test' method of the base class as it is
# the looping hander.
def main(HandlerClass=RewritingHTTPRequestHandler,
         ServerClass=BaseHTTPServer.HTTPServer):
    BaseHTTPServer.test(HandlerClass, ServerClass)


if __name__ == '__main__':
    main()
