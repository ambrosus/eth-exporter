// tslint:disable-next-line:match-default-export-name
import * as axios from 'axios';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as yargs from 'yargs';
import { expect } from 'chai';
import { validateConfig } from '../src/helpers';
import { createServer } from '../src/index';

const httpClient = axios.default.create();

const goodConfig = yaml.safeLoad(
  fs.readFileSync(`${process.cwd()}/config.good.yml`, 'utf8')
);

const rpcUrl = 'http://localhost:8545';
const port = '9998';
const exporterUrl = `http://localhost:${port}`;

describe('Eth Exporter Configurations', () => {
  it('does not throw when passed good configs', () => {
    expect(() => {
      validateConfig(goodConfig);
    }).to.not.throw();
  });

  it('throws when passed bad config', () => {
    const badConfig = yaml.safeLoad(
      fs.readFileSync(`${process.cwd()}/test/config.bad.yml`, 'utf8')
    );
    expect(() => {
      validateConfig(badConfig);
    }).to.throw();
  });
});

describe('Eth Exporter Responses with default config', () => {
  let parityResponse;
  let server;

  before(async () => {
    server = await createServer(rpcUrl, port, []);
    ({ data: parityResponse } = await httpClient.get(`${exporterUrl}/metrics`));
  });

  after(() => {
    server.close();
  });

  it('has an index page', async () => {
    let indexResponse = await httpClient.get(exporterUrl);

    expect(indexResponse.data).to.equal(
      '<p> You can find Metrics on the <a href="/metrics"> /Metrics</a> path </p>'
    );
  });

  it('get parity version', () => {
    expect(parityResponse).to.contain('parity_version{value="Parity-Ethereum');
  });

  it('get gas price', () => {
    expect(parityResponse).to.match(/parity_gas_price [0-9]+/);
  });

  it('get block size', () => {
    expect(parityResponse).to.match(/parity_block_size [0-9]+/);
  });

  it('get block gas limit', () => {
    expect(parityResponse).to.match(/parity_block_gas_limit [0-9]+/);
  });

  it('get block gas used', () => {
    expect(parityResponse).to.match(/parity_block_gas_used [0-9]+/);
  });

  it('get block total difficulty', () => {
    expect(parityResponse).to.match(/parity_total_block_difficulty [0-9]+/);
  });

  it('get latest miner', () => {
    expect(parityResponse).to.match(/parity_block_latest_miner{address=/);
  });

  it('does not contain address balance when addresses are not defined', () => {
    expect(parityResponse).to.not.contain('parity_address_balance{address=}');
  });
  it('get transaction queue', () => {
    expect(parityResponse).to.contain('parity_transaction_queue');
  });
});

describe('Eth Exporter with addresses config', () => {
  let parityResponse;
  let server;
  const addresses = [
    { address: '0x4A369a8cEBE11c0D7dBE2C653F4DB83591e9eAc9', alias: 'wallet1' },
    { address: '0x4A369a8cEBE11c0D7dBE2C653F4DB83591e9eAc9', alias: 'wallet2' }
  ];

  before(async () => {
    server = await createServer(rpcUrl, port, addresses);
    ({ data: parityResponse } = await httpClient.get(`${exporterUrl}/metrics`));
  });

  after(() => {
    server.close();
  });

  it('get address balance', () => {
    expect(parityResponse).to.contain(
      `parity_address_balance{address="${addresses[0].address}",alias="${
        addresses[0].alias
      }"}`
    );
  });
});

describe('Eth Exporter with Eth down', () => {
  let parityResponse;
  let server;
  const rpcUrl = 'http://localhost:9999';

  before(() => {
    server = createServer(rpcUrl, port, []);
  });

  after(() => {
    server.close();
  });

  it('parity status is down', async () => {
    let response = await httpClient.get(`${exporterUrl}/metrics`);
    parityResponse = response.data;
    expect(parityResponse).to.contain('parity_up 0');
  });
});
