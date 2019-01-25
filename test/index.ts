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
  const defaultConfig = yaml.safeLoad(
    fs.readFileSync(`${process.cwd()}/config.yml`, 'utf8')
  );

  let parityResponse;
  const { rpcUrl, port, addresses } = defaultConfig;
  const url = `http://localhost:${port}`;
  let server;

  before(async () => {
    server = await createServer(rpcUrl, port, addresses);
    ({ data: parityResponse } = await httpClient.get(`${url}/metrics`));
  });

  after(() => {
    server.close();
  });

  it('has an index page', async () => {
    let indexResponse = await httpClient.get(url);

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
    if (addresses) {
      expect(parityResponse).to.not.contain('parity_address_balance{address=}');
    }
  });
  it('get transaction queue', () => {
    expect(parityResponse).to.contain('parity_transaction_queue');
  });
});

describe('Eth Exporter with addresses config', () => {
  let parityResponse;
  const { rpcUrl, port, addresses } = goodConfig;
  const url = `http://localhost:${port}`;
  let server;

  before(async () => {
    server = await createServer(rpcUrl, port, addresses);
    ({ data: parityResponse } = await httpClient.get(`${url}/metrics`));
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
  const { rpcUrl, port, addresses } = goodConfig;
  const url = `http://localhost:${port}`;

  before(() => {
    server = createServer('http://localhost:9999', port, addresses);
  });

  after(() => {
    server.close();
  });

  it('parity status is down', async () => {
    let response = await httpClient.get(`${url}/metrics`);
    parityResponse = response.data;
    expect(parityResponse).to.contain('parity_up 0');
  });
});
