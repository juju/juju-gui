FROM ubuntu:bionic

# Set up environment
ENV LANG C.UTF-8
WORKDIR /srv

# System dependencies
# Node ppa provided by: https://github.com/nodesource/distributions
RUN apt-get update && \
    apt-get install curl --yes && \
    curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt-get update && \
    apt-get install --yes build-essential python3-dev python3-pip

# Import code, install code dependencies
ADD templates/ templates/
ADD static/assets/ static/assets/
ADD static/build/ static/build/
ADD static/gui/ static/gui/
ADD webapp/ webapp/
ADD requirements.txt requirements.txt
ADD entrypoint entrypoint
RUN pip3 install -r requirements.txt

ARG TALISKER_REVISION_ID
RUN test -n "${TALISKER_REVISION_ID}"
ENV TALISKER_REVISION_ID "${TALISKER_REVISION_ID}"

# Setup commands to run server
ENTRYPOINT ["./entrypoint"]
CMD ["0.0.0.0:80"]
