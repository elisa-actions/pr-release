FROM node:20

COPY entrypoint.sh /entrypoint.sh
ADD . .
RUN npm install

ENTRYPOINT ["/entrypoint.sh"]
