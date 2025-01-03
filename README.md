# Screeps Nexus

## Background

I can't set up Screeps server from official [repo](https://github.com/screeps/screeps), and since it's open source, I decide picked modules and combine them to mono repo to troubleshooting.

## Install

1. Download and setup Steam SDK for greenwork. [document](https://github.com/greenheartgames/greenworks/blob/master/docs/get-steamworks-sdk.md)

```shell
nvm use 18

# Used to fix build issue in `@screeps/driver`
export CXXFLAGS='-include /usr/include/c++/13/limits'

pnpm install
```

## Usage

1. Open Steam

```shell
pnpm exec screeps-launcher init
pnpm exec screeps-launcher start
```

```shell
pnpx tsx packages/launcher/src/screeps.ts start
```

```shell
# Connect to backend with CLI
pnpx tsx packages/launcher/src/screeps.ts cli
```

## Docker

```shell
pnpm exec screeps-launcher init
docker compose up --build
```