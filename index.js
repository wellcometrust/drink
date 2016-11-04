const Sequelize = require('sequelize');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const terms = require('./terms.js').terms;
const db = require('./lib/db.js').db;
const SearchResult = require('./lib/db.js').SearchResult;
const SearchMetadata = require('./lib/db.js').SearchMetadata;
const fetchDocumentCount = require('./lib/fetch_searches.js').fetchDocumentCount;
const fetchTermsResults = require('./lib/fetch_searches.js').fetchTermsResults;

app.set('port', port);
app.engine('html', require('hogan-express'));
app.set('layout', 'layouts/app')
app.set('view engine', 'html');
app.set('partials', { hit: 'partials/hit.html' });
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));

fetchDocumentCount();
fetchTermsResults();

app.get('/', (req, res) => {
  // TODO
  // fetch the results from the database instead
  if (results.all || results.neutral || results.critical) {
      res.render('templates/searchResults', {results: results, hits: hits, terms: terms, documentCount: documentCount});
  } else {
    res.send('No results yet.');
  }
});

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
