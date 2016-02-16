# PipSession is not available in older pips.
try:
    from pip.download import PipSession
except ImportError:
    # Precise has an old version of pip that lacks PipSession.
    PipSession = None
from pip.req import parse_requirements
from setuptools import setup, find_packages

if PipSession is not None:
    pip_session = PipSession()
    kwargs = dict(session=pip_session)
else:
    # The parse_requirements in the precise version of pip is broken
    # and requires options.skip_requirements_regex to be present.
    from collections import namedtuple
    options = namedtuple('Options', 'skip_requirements_regex')
    kwargs = dict(options=options(skip_requirements_regex=None))

requirements = parse_requirements("requirements.txt", **kwargs)
test_requirements = parse_requirements("test-requirements.txt", **kwargs)
install_requires = [str(req.req) for req in requirements]
tests_require = [str(req.req) for req in test_requirements]

setup(name='jujugui',
      version='2.0.3',
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
      include_package_data=True,          # Refer to MANIFEST.in
      zip_safe=False,
      install_requires=install_requires,
      tests_require=tests_require,
      test_suite="jujugui",
      entry_points="""\
      [paste.app_factory]
      main = jujugui:main
      test = jujugui.test:main
      """,
      )
