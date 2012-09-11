'use strict';
// Tests data.

YUI(GlobalConfig).add('juju-tests-data', function(Y) {
    var jujuTests = Y.namespace('juju-tests');

    jujuTests.data = {

        charmSearchQuery: 'mongodb',

        charmSearchResults: {
            "matches": 6,
            "charm_total": 429,
            "results_size": 6,
            "search_time": 0.00102,
            "results": [
                {
                    "data_url": "/charms/precise/cf-mongodb/json",
                    "name": "cf-mongodb",
                    "series": "precise",
                    "summary":
                        "An object/document-oriented database (metapackage)",
                    "relevance": 29.6,
                    "owner": "charmers"
                },
                {
                    "data_url": "/charms/precise/mongodb/json",
                    "name": "mongodb",
                    "series": "precise",
                    "summary":
                        "An object/document-oriented database (metapackage)",
                    "relevance": 24.5,
                    "owner": "charmers"
                },
                {
                    "data_url": "/charms/oneiric/cf-mongodb/json",
                    "name": "cf-mongodb",
                    "series": "oneiric",
                    "summary":
                        "An object/document-oriented database (metapackage)",
                    "relevance": 29.7,
                    "owner": "charmers"
                },
                {
                    "data_url": "/charms/oneiric/mongodb/json",
                    "name": "mongodb",
                    "series": "oneiric",
                    "summary":
                        "An object/document-oriented database (metapackage)",
                    "relevance": 28.6,
                    "owner": "charmers"
                },
                {
                    "data_url": "/~flepied/precise/mongodb/json",
                    "name": "mongodb",
                    "series": "precise",
                    "summary":
                        "An object/document-oriented database (metapackage)",
                    "relevance": 28.6,
                    "owner": "flepied"
                },
                {
                    "data_url": "/~negronjl/precise/mongodb/json",
                    "name": "mongodb",
                    "series": "precise",
                    "summary":
                        "An object/document-oriented database (metapackage)",
                    "relevance": 24.5,
                    "owner": "negronjl"
                }
            ]
        },

        charmQuery: '/charms/precise/postgresql/json',

        charmResults: {
            "maintainer": "Mark Mims <mark.mims@canonical.com>",
            "series": "precise",
            "owner": "charmers",
            "provides": {
                "db-admin": {
                    "interface": "pgsql"
                },
                "db": {
                    "interface": "pgsql"
                }
            },
            "description": "PostgreSQL is a fully featured RDBMS.",
            "name": "postgresql",
            "summary": "object-relational SQL database (supported version)",
            "bzr_branch": "lp:~charmers/charms/precise/postgresql/trunk",
            "last_change": {
                "committer": "David Owen <david.owen@canonical.com>",
                "message": "Only reload for pg_hba updates",
                "revno": 24,
                "created": 1340206387.539
            },
            "proof": {}
        }

    };

});
