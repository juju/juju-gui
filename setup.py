from setuptools import setup, find_packages


def parse_requirements(filename):
    """Return a list of name|comparator|version."""
    with open(filename) as fd:
        return [line.strip() for line in  fd.readlines()]


install_requires = parse_requirements("requirements.txt")
tests_requires = parse_requirements("test-requirements.txt")

setup(name='jujugui',
      version='2.12.1',
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
      tests_require=tests_requires,
      test_suite="jujugui",
      entry_points="""\
      [paste.app_factory]
      main = jujugui:main
      test = jujugui.test:main
      """,
      )
