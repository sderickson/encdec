FROM mhart/alpine-node-base:0.10
MAINTAINER Scott Erickson <sderickson@gmail.com>

RUN apk-install flac lame

WORKDIR /src
ADD server.js server.js

EXPOSE 8000 8001 8002
CMD ["node", "server.js"]