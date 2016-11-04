const Sequelize = require('sequelize');

sequelize = new Sequelize(process.env.DATABASE_URL);

sequelize
  .authenticate()
  .then(function(err) {
    console.log('Connection has been established successfully.');
  })
  .catch(function (err) {
    console.log('Unable to connect to the database:', err);
  });

var SearchResult = sequelize.define('search_result', {
  queryTerms: {
    type: Sequelize.STRING
  },
  result: {
    type: Sequelize.JSONB
  }
});

module.exports.db = sequelize;
module.exports.SearchResult = SearchResult;

