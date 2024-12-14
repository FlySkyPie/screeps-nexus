FROM node:18.20.4-bookworm AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /screeps

COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .

COPY packages/backend/package.json ./packages/backend/package.json
COPY packages/common/package.json ./packages/common/package.json
COPY packages/driver/package.json ./packages/driver/package.json
COPY packages/launcher/package.json ./packages/launcher/package.json
COPY packages/PathFinding.js/package.json ./packages/PathFinding.js/package.json
COPY packages/storage/package.json ./packages/storage/package.json
COPY packages/vm-runtime/package.json ./packages/vm-runtime/package.json

RUN pnpm install --frozen-lockfile

COPY packages packages

RUN pnpm --stream -r build:storage
RUN pnpm --stream -r build:backend

RUN apt-get update && \
    apt-get -y install libstdc++6
ARG CXXFLAGS='-include /usr/include/c++/12/limits'
RUN pnpm --stream -r build:driver-native

RUN pnpm --stream -r build:vm-context
RUN pnpm --stream -r build:main
# RUN pnpm --stream -r build

FROM node:18.20.4-bookworm AS storage

WORKDIR /server

COPY --from=builder /screeps/packages/storage/dist ./

ENTRYPOINT [ "node", "index.js" ]

FROM node:18.20.4-bookworm AS backend

WORKDIR /server

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY --from=builder /screeps/packages/backend/dist ./

ENTRYPOINT [ "node", "index.js" ]

FROM node:18.20.4-bookworm AS main

WORKDIR /server

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apt-get update && \
    apt-get -y install libstdc++6

COPY --from=builder /screeps/packages/engine/dist/main ./

ENTRYPOINT [ "node", "index.js" ]
# ENTRYPOINT ["tail", "-f", "/dev/null"]
