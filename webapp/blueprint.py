import os

import flask


gui = flask.Blueprint(
    "gui", __name__, template_folder="/templates", static_folder="/static"
)

JAAS_URL = "https://jaas.ai"
INDEX = "index.html"


def loggedIn():
    return (
        flask.request.cookies.get("logged-in") == "true"
        # Jeff April 29 2019 - The old jujucharms.com website used the
        # `auth_tkt` cookie to store a hash to indicate that they were
        # logged in. If this is still here a few months after the above date it
        # can be removed without issue as any service that provides this
        # cookie will have been sunset.
        or flask.request.cookies.get("auth_tkt") is not None
    )


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
        return flask.redirect(os.path.join(JAAS_URL, path))


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
