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
    apt-get install --yes \
        build-essential python3-dev python3-pip git curl nodejs

# Import code, install code dependencies
ADD . .
RUN pip3 install -r requirements.txt
RUN npm install --global yarn
RUN yarn build-prod

# Setup commands to run server
ENTRYPOINT ["./entrypoint"]
CMD ["0.0.0.0:80"]
