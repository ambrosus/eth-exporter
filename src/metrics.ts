import { Registry, Gauge } from 'prom-client';
// tslint:disable-next-line:no-submodule-imports
import { hashObject } from 'prom-client/lib/util';
import express = require('express');
import {
  IMiner,
  makeRequest,
  IAddress,
  IPrometheusClient,
  ICreateMetrics,
  ILatestMiner
} from './helpers';
import * as http from 'http';
import * as moment from 'moment';

export function createPrometheusClient(
  node: string,
  addressList: IAddress[],
  minerList: IAddress[]
): IPrometheusClient {
  const register = new Registry();
  return {
    createMetrics: createMetrics(register, node, addressList, minerList),
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
  addressList: IAddress[],
  minerList: IAddress[]
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
    latestMinedBlocksByMiners: createGauge(
      'parity_latest_mined_blocks_by_miners',
      'Latest Mined Block of Specific Miners',
      ['address', 'alias']
    ),
    parityUp: createGauge('parity_up', 'Parity up/down', []),
    totalDifficulty: createGauge(
      'parity_total_block_difficulty',
      'Parity Block Difficulty',
      []
    ),
    gasUsed: createGauge('parity_block_gas_used', 'Parity Block Gas Used', []),
    blockNonce: createGauge('parity_block_nonce', 'Parity Block Nonce', []),
    blockSize: createGauge('parity_block_size', 'Parity Block Size', []),
    gasLimit: createGauge('parity_block_gas_limit', 'Parity Gas Limit', []),
    latestMiner: createGauge(
      'parity_block_latest_miner',
      'Parity Latest Miner',
      []
    )
  };

  const timeSinceMined: ILatestMiner[] = [];
  if (minerList.length !== 0) {
    minerList.map((miner: IMiner) => {
      timeSinceMined[miner.address] = {
        address: miner.address,
        alias: miner.alias,
        lastMining: 0
      };
    });
  }

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
    gauges.transactionQueue.set(transactionQueue.length);

    const blockData = await makeRequest(nodeURL, 'eth_getBlockByNumber', [
      latestBlockNumber,
      false
    ]);

    gauges.blockSize.set(parseInt(blockData.size, 16));
    gauges.totalDifficulty.set(parseInt(blockData.totalDifficulty, 16));
    gauges.blockNonce.set(parseInt(blockData.nonce, 16));
    gauges.latestMiner.set(parseInt(blockData.miner, 16));
    gauges.gasUsed.set(parseInt(blockData.gasUsed, 16));
    gauges.gasLimit.set(parseInt(blockData.gasLimit, 16));

    if (addressList.length !== 0) {
      addressList.map(async (item: IAddress) => {
        const addressBalance = await makeRequest(nodeURL, 'eth_getBalance', [
          item.address
        ]);
        gauges.addressBalance.set(
          { address: item.address, alias: item.alias },
          parseInt(addressBalance, 16)
        );
      });
      await setMiners(
        minerList,
        latestBlockNumber,
        nodeURL,
        timeSinceMined,
        gauges
      );
    }
  };
}
export async function setMiners(
  minerList: IAddress[],
  latestBlockNumber: string,
  nodeURL: string,
  timeSinceMined: ILatestMiner[],
  // tslint:disable-next-line
  gauges
): Promise<void> {
  if (minerList.length !== 0) {
    let blockNumberUse = parseInt(latestBlockNumber, 16);
    for (const i = blockNumberUse - 20; i <= blockNumberUse; blockNumberUse--) {
      if (blockNumberUse < 0) {
        return;
      }
      const hexValue = `0x${blockNumberUse.toString(16)}`;
      const evaluatedBlock = await makeRequest(
        nodeURL,
        'eth_getBlockByNumber',
        [hexValue, false]
      );
      minerList.map((miner: IMiner) => {
        if (
          parseInt(evaluatedBlock.miner, 16) === parseInt(miner.address, 16)
        ) {
          const timeMined = parseInt(evaluatedBlock.timestamp, 16);
          // we add one to ensure that the default prometheus gauge
          // value indicates that the blocks have not been mined
          gauges.latestMinedBlocksByMiners.set(
            { address: miner.address, alias: miner.alias },
            moment().unix() - timeMined + 1
          );
          timeSinceMined[miner.address].lastMining = timeMined;
        } else {
          gauges.latestMinedBlocksByMiners.set(
            { address: miner.address, alias: miner.alias },
            moment().unix() - timeSinceMined[miner.address].lastMining
          );
        }
      });
    }
  }
}
