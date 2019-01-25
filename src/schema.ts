export const schema = {
  type: 'object',
  required: ['rpcUrl', 'port'],
  properties: {
    rpcUrl: {
      type: 'string',
      pattern:
        '^(http|https)://(([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9]).)*([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])(:[0-9]+)?$'
    },
    port: {
      type: 'string',
      pattern: '^[0-9]*$'
    },
    addresses: {
      type: 'array',
      items: {
        type: 'object',
        required: ['address'],
        properties: {
          address: {
            type: 'string',
            pattern: '0[xX][0-9a-fA-F]+'
          },
          alias: {
            type: 'string',
            pattern: '^(.*)$'
          }
        }
      }
    }
  }
};
