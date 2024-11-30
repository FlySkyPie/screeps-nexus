# Screeps Nexus

## Background

I can't set up Screeps server from official [repo](https://github.com/screeps/screeps), and since it's open source, I decide picked modules and combine them to mono repo to troubleshooting.

## Install

```shell
# Used to fix build issue in `@screeps/driver`
export CXXFLAGS='-include /usr/include/c++/13/limits'
pnpm install
```

## Usage

```shell
pnpm exec screeps init
pnpm exec screeps start
```
