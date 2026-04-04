

const fs = require('fs');
const YAML = require('yaml');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require("path");
const componentsPath = path.join(__dirname, '../docs/components.yml');
const components = YAML.parse(fs.readFileSync(componentsPath, 'utf8'));
const pathsfile = path.join(__dirname, '../docs/path.yml');
const paths = YAML.parse(fs.readFileSync(pathsfile, 'utf8'));
let options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MySouq',
      version: '1.0.0',
      description: ``,
    },
    servers:
      [
        {
          "url": `https://apid.bazaarghar.com/v1/`,
          'description': 'live server',

        },
        {
          "url": `https://apix-stage.bazaarghar.com/v1/`,
          'description': 'stage server',

        },
        {
          "url": `http://localhost:3000/v1`,
          'description': 'local server',

        }

      ], 
    components: components.components,
    paths: paths.paths // Assuming 'components' is the top-level key in your components.yml
  },
  apis: [path.join(__dirname, 'app/**/*.js')],
};

let swaggerDef = swaggerJsdoc(options);
module.exports = { swaggerDef, options }
