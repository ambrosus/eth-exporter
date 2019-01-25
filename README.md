Parity Eth Exporter
=====

A [Parity](https://parity.io/) exporter for Prometheus.

This parity exporter sets focus on a network overview and an overview of the cryptoeconomics. To get insights of each nodes status(as sync time, current block) use the [Parity Exporter](https://github.com/honeylogicio/parity_exporter/)

## Configuration
The configuration is in YAML, an example with common options:
```
---
rpcUrl: 'http://localhost:8545'
port: '9998'
```

Name     | Description
---------|------------
rpcUrl   | Optional. The rpcUrl to the Parity client. Default http://localhost:8545.
port   | Optional. The port to expose the metrics at. Default 9998.
Miners   | Optional. The address and alias of how long ago the miner mined a block.
Addresses   | Optional. The address and alias of an address' balance that you would like to track.


## Exported Metrics

All metrics are exported as gauges.

| Metric | Meaning | Labels |
| ------ | ------- | ------ |
| parity_up | Indicates if the Parity client is up or not | |
| parity_version | The Parity client version | |
| parity_transaction_queue | The current transaction queue | |
| parity_address_balance | Balance of addresses that you specified in the config | |
| parity_latest_mined_blocks_by_miners | The latest time a miner you specified in the config mined a block | |
| parity_gas_price | Current gas price in Wei | |
| parity_total_block_difficulty | Total difficulty of a block | |
| parity_block_gas_used | Block gas usage | |
| parity_block_nonce | Block gas nonce | |
| parity_block_size | Block size | |
| parity_block_gas_limit | Block gas limit | |
| parity_block_latest_miner | The latest block miner | |

## Docker Image

To run the Parity exporter on Docker, you can use the [honeylogic/ethereum-exporter](https://hub.docker.com/r/honeylogic/ethereum-exporter)
image. It exposes port 9997 and expects the config in `/app/config.yml`. To
configure it, you can bind-mount a config from your host:

```
$ docker run -p 9998:9998 -v /path/on/host/config.yml:/app/config.yml honeylogic/parity_exporter
```

Specify the config as the CMD:

```
$ docker run -p 9998:9998 -v /path/on/host/config.yml:/config/config.yml honeylogic/parity_exporter --config /config/config.yml
```

## Contributing

`npm build` to build.

`npm start` to run.

