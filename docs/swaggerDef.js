const { version } = require('../package.json');
const config = require('../config/config');

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Bazar-247',
    version,
    license: {
      name: 'MIT',
      url: 'https:/master/LICENSE',
    },
  },
  servers:
    [
      {
        "url": `https://apid.bazaarghar.com/v1`,
        "description": 'Live server',

      },
      {
        "url": `https://apix-stage.bazaarghar.com/v1`,
        "description": 'staged server',

      }, {
        "url": `http://localhost:${config.port}/v1`,
        'description': 'local server',

      }
    ],
};
module.exports = swaggerDef;
