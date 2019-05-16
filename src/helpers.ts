import * as http from 'http';
import * as axios from 'axios';
import * as express from 'express';
import * as Validator from 'ajv';
import { Registry } from 'prom-client';
import { schema } from './schema';

const httpClient = axios.default.create({
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
});

export function validateConfig(config: any): void {
  const validate = new Validator().compile(schema);
  const valid = validate(config);

  if (valid) {
    return;
  }
  let allErrors = '';
  for (const singleValidation of validate.errors) {
    allErrors = `${allErrors} ${singleValidation.dataPath} ${
      singleValidation.message
    }\r\n`;
  }
  throw allErrors;
}

export interface IConfig {
  addresses: IAddress[];
  port: string;
  rpcUrl: string;
}

export interface IAddress {
  address: string;
  alias: string;
}

export type ICreateMetrics = (
  register?: Registry,
  node?: string,
  addressList?: IAddress[]
) => Promise<void>;

type IHttpRequest = (req: express.Request, res: express.Response) => void;

export interface IPrometheusClient {
  createMetrics: ICreateMetrics;
  serveMetrics: IHttpRequest;
}

export async function makeRequest(
  url: string,
  method: string,
  params: any[] = []
): Promise<any> {
  try {
    const response = await httpClient({
      url: url,
      method: 'post',
      data: {
        jsonrpc: '2.0',
        method,
        params,
        id: 42
      }
    });

    if (response.data.error == null) {
      console.log(method,' -> OK');
    } else {
      console.log(method,' -> ', response.data.error.message);
    }

    return response.data.result;
  } catch (error) {
    return false;
  }
}
