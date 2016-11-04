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
const fetchSingleResult = require('./lib/fetch_searches.js').fetchSingleResult;
const fetchSingleResultFor = require('./lib/fetch_searches.js').fetchSingleResultFor;

app.set('port', port);
app.engine('html', require('hogan-express'));
app.set('layout', 'layouts/app')
app.set('view engine', 'html');
app.set('partials', { hit: 'partials/hit.html' });
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));

var stats = { total: 2562, moh: 2232, cookbooks: 322, insurance: 8 };
var searchResults = { all: null, neutral: null, medical: null };
var documentCount = fetchDocumentCount();

fetchTermsResults();

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
    res.render('templates/searchResults', { searchResults: searchResults, terms: terms, documentCount: stats.total });
  } else {
    res.send('Cannot find any results.');
  }
});

app.get('/:searchTerm', (req, res) => {
  SearchResult.findOne({ where: { queryTerms: req.params.searchTerm } }).then(result => {
    if (result) {
      res.render('templates/singleResult', { result: result, req: req, stats: stats });
    } else {
      res.send('Sorry, not found.');
      fetchSingleResult(req.params.searchTerm).then(resp => {
        console.log(resp);
      })
    }
  });
});

app.get('/:searchTerm/:source', (req, res) => {
  SearchResult.findOne({ where: { queryTerms: req.params.searchTerm + '-' + req.params.source } }).then(result => {
    if (result) {
      res.render('templates/singleResultFor', { result: result, req: req, source: req.params.source, total: stats[req.params.source] });
    } else {
      res.send('Sorry, not found.');
      fetchSingleResultFor(req.params.searchTerm, req.params.source).then(resp => {
        console.log(resp);
      })
    }
  });
});

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
