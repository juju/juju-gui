import os

import flask


gui = flask.Blueprint(
    "gui", __name__, template_folder="/templates", static_folder="/static"
)

JAAS_URL = "https://jaas.ai"
INDEX = "index.html"


def loggedIn():
    return "loggedin" in flask.request.cookies


@gui.route("/")
def root():
    if loggedIn():
        return flask.redirect("/new")
    else:
        return flask.redirect(JAAS_URL)


@gui.route("/home")
def jaas():
    return flask.redirect(JAAS_URL)


@gui.route("/new")
@gui.route("/login")
@gui.route("/logout")
def guiIndex(path=""):
    return flask.render_template(INDEX)


@gui.route("/<path:path>")
def entity(path=""):
    if loggedIn():
        return flask.render_template(INDEX)
    else:
        return flask.redirect(JAAS_URL + path)


@gui.route("/robots.txt")
def robots():
    return flask.Response("", mimetype="text/plain")


@gui.route("/config.js")
def config():
    JAAS_API_BASE = os.environ.get(
        "JAAS_API_BASE", default="https://api.jujucharms.com"
    )
    JIMM_WSS_URL = os.environ.get(
        "JIMM_WSS_URL", default="jimm.jujucharms.com:443"
    )

    return (
        flask.render_template(
            "config.js.jinja",
            apiAddress=JIMM_WSS_URL,
            baseUrl="/",
            bundleServiceURL="https://" + JAAS_API_BASE + "/bundleservice",
            charmstoreURL="https://" + JAAS_API_BASE + "/charmstore",
            controllerSocketTemplate="wss://$server:$port/api",
            flags="{terminal: true, support: true, anssr: true, expert: true}",
            gisf="true",
            uuid="",
            paymentURL="https://" + JAAS_API_BASE + "/payment",
            plansURL="https://" + JAAS_API_BASE + "/omnibus",
            ratesURL="https://" + JAAS_API_BASE + "/omnibus",
            socketTemplate="wss://$server:$port/model/$uuid/api",
            staticURL="/static",
            termsURL="https://" + JAAS_API_BASE + "/terms",
        ),
        200,
        {"Content-Type": "text/javascript"},
    )


@gui.route("/_status/check")
def check():
    return "OK"
