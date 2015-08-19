FROM mhart/alpine-node:0.10
MAINTAINER Scott Erickson <sderickson@gmail.com>

RUN apk-install flac lame sox
RUN npm install forever -g

WORKDIR /src
ADD server.js server.js
ADD . .

RUN npm install

EXPOSE 8000 8001 8002 8003 8010
CMD ["forever", "server.js"]