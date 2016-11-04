const Sequelize = require('sequelize');
const elasticsearch = require('elasticsearch');

var connectionString = process.env.BONSAI_URL;
var searchClient = new elasticsearch.Client({
  host: connectionString,
  requestTimeout: 600000
});

module.exports = searchClient;
