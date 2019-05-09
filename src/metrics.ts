import { Registry, Gauge } from 'prom-client';
import * as express from 'express';
import {
  makeRequest,
  IAddress,
  IPrometheusClient,
  ICreateMetrics
} from './helpers';
import * as http from 'http';

export function createPrometheusClient(
  node: string,
  addressList: IAddress[]
): IPrometheusClient {
  const register = new Registry();
  return {
    createMetrics: createMetrics(register, node, addressList),
    serveMetrics(req: express.Request, res: express.Response): void {
      res.setHeader('Content-Type', register.contentType);
      res.end(register.metrics());
    }
  };
}

// tslint:disable-next-line
export function createMetrics(
  registry: Registry,
  nodeURL: string,
  addressList: IAddress[]
): ICreateMetrics {
  const createGauge = (name: string, help: string, labelNames: string[]) =>
    new Gauge({ name, help, labelNames, registers: [registry] });

  const gauges = {
    version: createGauge('parity_version', 'Client version', ['value']),
    gasPrice: createGauge('parity_gas_price', 'Current gas price in wei', []),
    transactionQueue: createGauge(
      'parity_transaction_queue',
      'Transaction Queue',
      []
    ),
    addressBalance: createGauge('parity_address_balance', 'Address Balance', [
      'address',
      'alias'
    ]),
    parityUp: createGauge('parity_up', 'Parity up/down', []),
    totalDifficulty: createGauge(
      'parity_total_block_difficulty',
      'Parity Block Difficulty',
      []
    ),
    gasUsed: createGauge('parity_block_gas_used', 'Parity Block Gas Used', []),
    blockSize: createGauge('parity_block_size', 'Parity Block Size', []),
    gasLimit: createGauge('parity_block_gas_limit', 'Parity Gas Limit', []),
    latestMiner: createGauge(
      'parity_block_latest_miner',
      'Parity Latest Miner',
      ['address']
    )
  };

  return async () => {
    const [
      clientVersion,
      gasPrice,
      latestBlockNumber,
      transactionQueue
    ] = await Promise.all([
      makeRequest(nodeURL, 'web3_clientVersion'),
      makeRequest(nodeURL, 'eth_gasPrice'),
      makeRequest(nodeURL, 'eth_blockNumber'),
      makeRequest(nodeURL, 'parity_allTransactions')
    ]);

    // See if call failed
    if (clientVersion === false) {
      gauges.parityUp.set(0);
      return;
    }

    gauges.parityUp.set(1);
    gauges.version.set({ value: clientVersion }, 1);
    gauges.gasPrice.set(parseInt(gasPrice, 16));

    try {
      gauges.transactionQueue.set(transactionQueue.length);
    } catch (e) {
      gauges.transactionQueue.set(0);
    }

    const blockData = await makeRequest(nodeURL, 'eth_getBlockByNumber', [
      latestBlockNumber,
      false
    ]);

    gauges.blockSize.set(parseInt(blockData.size, 16));
    gauges.totalDifficulty.set(parseInt(blockData.totalDifficulty, 16));
    gauges.latestMiner.set(
      { address: blockData.miner },
      parseInt(blockData.timestamp, 16)
    );
    gauges.gasUsed.set(parseInt(blockData.gasUsed, 16));
    gauges.gasLimit.set(parseInt(blockData.gasLimit, 16));
    if (addressList) {
      await Promise.all(
        addressList.map(async (item: IAddress) => {
          const addressBalance = await makeRequest(nodeURL, 'eth_getBalance', [
            item.address
          ]);
          gauges.addressBalance.set(
            { address: item.address, alias: item.alias },
            parseInt(addressBalance, 16)
          );
        })
      );
    }
  };
}
