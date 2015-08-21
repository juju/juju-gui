from pyramid.config import Configurator


def main(global_config, **settings):
    config = Configurator(settings=settings)
    config.add_static_view('/test', 'jujugui:static/gui/src/test')
    config.include('jujugui.gui')
    return config.make_wsgi_app()
