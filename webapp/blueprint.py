import flask


gui = flask.Blueprint(
    "gui",
    __name__,
    template_folder="/templates",
    static_folder="/static",
)

@gui.route("/")
@gui.route("/<path:path>")
def homepage(path):
    return flask.render_template("index.html")

@gui.route("/robots.txt")
def robots():
    return flask.Response("", mimetype="text/plain")

@gui.route("/_status/check")
def check():
    return "OK"
