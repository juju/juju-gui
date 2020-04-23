FROM ubuntu:focal

# Set up environment
ENV LANG C.UTF-8
WORKDIR /srv

# System dependencies
# Node ppa provided by: https://github.com/nodesource/distributions
RUN apt-get update && \
    apt-get install --yes build-essential python3-dev python3-pip

# Import code, install code dependencies
ADD templates/ templates/
ADD static/assets/ static/assets/
ADD static/build/ static/build/
ADD static/gui/ static/gui/
ADD webapp/ webapp/
ADD requirements.txt requirements.txt
ADD entrypoint entrypoint
ADD permanent-redirects.yaml permanent-redirects.yaml
RUN pip3 install -r requirements.txt

ARG BUILD_ID
RUN test -n "${BUILD_ID}"
ENV TALISKER_REVISION_ID "${BUILD_ID}"

# Setup commands to run server
ENTRYPOINT ["./entrypoint"]
CMD ["0.0.0.0:80"]
