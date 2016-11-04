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

var searchResults = { all: null, neutral: null, medical: null };
var documentCount = fetchDocumentCount();

fetchTermsResults();

SearchMetadata.findOne({ where: { name: 'documentCount' } }).then(count => {
  documentCount = count;
});

SearchResult.findOne({ where: { queryTerms: 'all' } }).then(results => {
  searchResults.all = results;
});

SearchResult.findOne({ where: { queryTerms: 'neutral' } }).then(results => {
  searchResults.neutral = results;
});

SearchResult.findOne({ where: { queryTerms: 'medical' } }).then(results => {
  searchResults.medical = results;
});

app.get('/', (req, res) => {
  if (searchResults) {
    res.render('templates/searchResults', { searchResults: searchResults, terms: terms, documentCount: documentCount });
  } else {
    res.send('Cannot find any results.');
  }
});

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
