FROM node:24

COPY entrypoint.sh /entrypoint.sh
COPY . /app
RUN cd /app && npm install

ENTRYPOINT ["/entrypoint.sh"]
