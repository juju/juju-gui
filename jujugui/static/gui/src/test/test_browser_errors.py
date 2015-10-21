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

import subprocess
import unittest

import browser


class TestFormatSubprocessError(unittest.TestCase):

    error = subprocess.CalledProcessError(2, 'mycmd', output='my output')

    def test_error_formatting(self):
        # A CalledProcessError is correctly formatted.
        message = browser.format_subprocess_error(self.error)
        expected = "Command 'mycmd' returned non-zero exit status 2: my output"
        self.assertEqual(expected, message)


if __name__ == '__main__':
    unittest.main()
