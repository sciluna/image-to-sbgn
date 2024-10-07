FROM node:20.14.0

# Install git and other dependencies
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# clone the repository
RUN git clone https://github.com/hasanbalci/image-to-sbgn.git
WORKDIR image-to-sbgn

# install dependencies
RUN npm install

EXPOSE 4000

CMD ["npm", "run", "start"]