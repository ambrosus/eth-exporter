import * as express from 'express';
import { createPrometheusClient } from './metrics';
import { instrumentProcess } from './instrument_process';
import * as yargs from 'yargs';
import * as http from 'http';
import { IAddress } from './helpers';

export function createServer(
  rpcUrl: string,
  port: string,
  addressList: IAddress[]
): http.Server {
  const promClient = createPrometheusClient(rpcUrl, addressList);
  const app = express();

  app.get('/metrics', async (req: express.Request, res: express.Response) => {
    try {
      await promClient.createMetrics();
      promClient.serveMetrics(req, res);
    } catch (e) {
      console.log(e);

      process.exit(1);
    }
  });
  app.get('/', (req: express.Request, res: express.Response) => {
    res.send(
      '<p> You can find Metrics on the <a href="/metrics"> /Metrics</a> path </p>'
    );
  });

  instrumentProcess();

  console.log({
    message: `Parity Exporter running on port ${port}, the set rpcUrl is ${rpcUrl}`
  });

  return app.listen(port);
}
