FROM node:20

ADD entrypoint.sh /entrypoint.sh
ADD . /app
RUN cd /app && npm install

ENTRYPOINT ["/entrypoint.sh"]
