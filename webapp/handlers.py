import socket
from datetime import datetime
from urllib.parse import unquote, urlparse, urlunparse

import flask
import webapp.template_utils as template_utils

def set_handlers(app):
    @app.context_processor
    def utility_processor():
        """
        This defines the set of properties and functions that will be added
        to the default context for processing templates. All these items
        can be used in all templates
        """

        return {
            # Functions
            "format_date": template_utils.format_date,
            "get_year": datetime.now,
            "replace_admin": template_utils.replace_admin,
            "versioned_static": template_utils.versioned_static,
            "truncate_chars": template_utils.truncate_chars,
        }

    # Error handlers
    # ===
    @app.errorhandler(404)
    def page_not_found(error):
        """
        For 404 pages, display the 404.html template,
        passing through the error description.
        """

        return flask.render_template("404.html", error=error.description), 404

    @app.errorhandler(500)
    @app.errorhandler(501)
    @app.errorhandler(502)
    @app.errorhandler(503)
    @app.errorhandler(504)
    @app.errorhandler(505)
    def internal_error(error):
        error_name = getattr(error, "name", type(error).__name__)
        status_code = getattr(error, "code", 500)

        return (
            flask.render_template("500.html", error_name=error_name),
            status_code,
        )

    # Global tasks for all requests
    # ===
    @app.before_request
    def clear_trailing():
        """
        Remove trailing slashes from all routes
        We like our URLs without slashes
        """

        parsed_url = urlparse(unquote(flask.request.url))
        path = parsed_url.path

        if path != "/" and path.endswith("/"):
            new_uri = urlunparse(parsed_url._replace(path=path[:-1]))

            return flask.redirect(new_uri)

    @app.after_request
    def add_headers(response):
        """
        Generic rules for headers to add to all requests
        - X-Hostname: Mention the name of the host/pod running the application
        - Cache-Control: Add cache-control headers for public and private pages
        """

        response.headers["X-Hostname"] = socket.gethostname()

        if response.status_code == 200:
            if flask.session:
                response.headers["Cache-Control"] = "private"
            else:
                # Only add caching headers to successful responses
                response.headers["Cache-Control"] = ", ".join(
                    {
                        "public",
                        "max-age=61",
                        "stale-while-revalidate=300",
                        "stale-if-error=86400",
                    }
                )

        return response
