Eth Exporter
=====

An exporter for [Parity](https://parity.io/) with focus on cryptoeconomics/ethereum, for Prometheus.

## Building and running

`npm build` to build.

`npm start` to run.

## Configuration
The configuration is in YAML, an example with common options:
```
---
rpcUrl: 'http://localhost:8546'
port: '9998'
```

Name     | Description
---------|------------
rpcUrl   | Optional. The rpcUrl to the Parity client. Default http://localhost:8546.
port   | Optional. The port to expose the metrics at. Default 9997.


## Exported Metrics

All metrics are exported as gauges.

| Metric | Meaning | Labels |
| ------ | ------- | ------ |
| parity_up | Indicates if the Parity Client is up or not | |
| parity_version | The Parity Client version | |
| parity_active_peers | How many active peers does the Parity Client have | |
| parity_connected_peers | How many connected peers does the Parity Client have | |
| parity_max_peers | The max peers that the Parity Client can have | |
| parity_sync_status | The amount of blocks that the Parity Client is behind | |
| parity_current_block | The current block of the Parity Client | |

## Docker Image

To run the Parity exporter on Docker, you can use the [honeylogic/parity_exporter](https://hub.docker.com/r/honeylogic/parity_exporter)
image. It exposes port 9997 and expects the config in `/app/config.yml`. To
configure it, you can bind-mount a config from your host:

```
$ docker run -p 9997:9997 -v /path/on/host/config.yml:/app/config.yml honeylogic/parity_exporter
```

Specify the config as the CMD:

```
$ docker run -p 9997:9997 -v /path/on/host/config.yml:/config/config.yml honeylogic/parity_exporter --config /config/config.yml
```

Or create a config file named /app/config.yml along with following
Dockerfile in the same directory and build it with `docker build`:

```
FROM honeylogic/parity_exporter
```
