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
    type: Sequelize.STRING,
    unique: true
  },
  result: {
    type: Sequelize.JSONB
  }
});

var SearchMetadata = sequelize.define('metadata', {
  name: {
    type: Sequelize.STRING,
    unique: true
  },
  content: {
    type: Sequelize.STRING
  }
});

SearchResult.sync();
SearchMetadata.sync();

module.exports.db = sequelize;
module.exports.SearchResult = SearchResult;
module.exports.SearchMetadata = SearchMetadata;

