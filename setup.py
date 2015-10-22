import os

from setuptools import setup, find_packages


here = os.path.abspath(os.path.dirname(__file__))
requires = [
    'pyramid',
    'pyramid_mako',
    'waitress',
    'convoy',
]


setup(name='jujugui',
      version='0.1.0',
      description='jujugui',
      classifiers=[
          "Programming Language :: Python",
          "Framework :: Pyramid",
          "Topic :: Internet :: WWW/HTTP",
          "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
      ],
      author='Juju UI Engineering Team',
      url='http://github.com/juju/juju-gui',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      install_requires=requires,
      tests_require=requires,
      test_suite="jujugui",
      entry_points="""\
      [paste.app_factory]
      main = jujugui:main
      test = jujugui.test:main
      """,
      )
