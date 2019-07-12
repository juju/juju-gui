"""
A Flask application for the Juju GUI
"""

import flask
import talisker.flask
import talisker.logs
from werkzeug.contrib.fixers import ProxyFix
from werkzeug.debug import DebuggedApplication
from werkzeug.routing import BaseConverter

from webapp.blueprint import gui


class RegexConverter(BaseConverter):
    def __init__(self, url_map, *items):
        super(RegexConverter, self).__init__(url_map)
        self.regex = items[0]


app = flask.Flask(
    __name__, template_folder="../templates", static_folder="../static"
)

talisker.logs.set_global_extra({"service": "juju-gui"})

app.url_map.strict_slashes = False
app.url_map.converters["regex"] = RegexConverter

app.wsgi_app = ProxyFix(app.wsgi_app)
if app.debug:
    app.wsgi_app = DebuggedApplication(app.wsgi_app)

talisker.flask.register(app)

app.register_blueprint(gui)

if __name__ == "__main__":
    app.run(host="0.0.0.0")
