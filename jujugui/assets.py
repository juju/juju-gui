# Copyright 2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).


def assets(config):
    config.add_static_view(
        'juju-ui/assets',
        'jujugui:static/gui/build/app/assets',
        cache_max_age=3600)


def includeme(config):
    return assets(config)
