from pip.download import PipSession
from pip.req import parse_requirements
from setuptools import setup, find_packages

pip_session = PipSession()
requirements = parse_requirements("requirements.txt", session=pip_session)
test_requirements = parse_requirements("test-requirements.txt",
                                       session=pip_session)

install_requires = [str(req.req) for req in requirements]
tests_require = [str(req.req) for req in test_requirements]

setup(name='jujugui',
      version='1.9.1',
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
