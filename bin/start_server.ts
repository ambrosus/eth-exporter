import * as yargs from 'yargs';
import { createServer } from '../src/index';
import { validateConfig, IConfig } from '../src/helpers';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

const args = yargs
  .usage('Usage: $0 [options]')
  .option('config', {
    default: `${process.cwd()}/config.yml`,
    describe: 'Full path to config',
    type: 'string'
  })
  .version()
  .help('help')
  .alias('help', 'h').argv;

// tslint:disable-next-line
const config: IConfig = yaml.safeLoad(fs.readFileSync(args.config, 'utf8'));
validateConfig(config);

createServer(config.rpcUrl, config.port, config.addresses);
