FROM node:20-alpine AS base

# INSTALL DEPENDENCIES FOR DEVELOPMENT (FOR NEST)
FROM base AS dev
WORKDIR /usr/src/app

COPY package.json ./

RUN yarn;

# INSTALL DEPENDENCIES & BUILD FOR PRODUCTION
FROM base AS build
WORKDIR /usr/src/app

COPY --from=dev /usr/src/app/node_modules ./node_modules
COPY . .

RUN yarn build

RUN yarn --frozen-lockfile --production;

# PRODUCTION IMAGE
FROM base AS production
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

CMD [ "node", "dist/src/main" ]