const Sequelize = require('sequelize');
const elasticsearch = require('elasticsearch');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const terms = require('./terms.js').terms;
const searchClient = require('./lib/search.js');
const db = require('./lib/db.js').db;
const SearchResult = require('./lib/db.js').SearchResult;

var getDocumentCount = () => {
  return searchClient.count({
    index: '_all'
  });
}

// common query together wirh cutoff_frequency and low_freq_operator
// will select the exact phrases and not any of the common words
// found elsewhere
var getResults = (searchTerms) => {
  return searchClient.search({
    body: {
      size: 15,
      query: {
        bool: {
          "must": {
            "match": {
              "_all": {
                "query":    "alcohol cirrhosis",
                "operator": "or",
                "fuzziness": 0.5
              }
            }
          },

          "should": [
            {
              "match": {
                "_all": {
                  "query": searchTerms.join(',')
                }
              }
            }
          ]
        }
      },
      "highlight" : {
        "order": "score",
        "number_of_fragments": 7,
        require_field_match: false,
        "pre_tags" : ["<b>"],
        "post_tags" : ["</b>"],
        "fields" : {
          "*" : {}
        }
      }
    }
  });
};

var hits = [];
var documentCount;
var results = { all: null, neutral: null, critical: null };

getResults(terms.all).then(resp => {
  if (resp) {
    SearchResult.sync().then(() => {
      return SearchResult.create({
        queryTerms: 'all',
        result: resp
      });
    });
  }
  results.all = resp;
  return getResults(terms.neutral);
}).then(resp => {
  if (resp) {
    SearchResult.sync().then(() => {
      return SearchResult.create({
        queryTerms: 'neutral',
        result: resp
      });
    });
  }
  results.neutral = resp;
  return getResults(terms.critical);
}).then(resp => {
  if (resp) {
    SearchResult.sync().then(() => {
      return SearchResult.create({
        queryTerms: 'medical',
        result: resp
      });
    });
  }
  results.critical = resp;
}).catch(err => {
  console.log(err.message);
  console.log(err.stack);
});

getDocumentCount().then(resp => {
  documentCount = resp.count;
  console.log('total document count: ', resp.count);
}, (err) => {
  console.log(err.message);
});

app.set('port', port);

app.engine('html', require('hogan-express'));
app.set('layout', 'layouts/app')
app.set('view engine', 'html');
app.set('partials', { hit: 'partials/hit.html' });
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  if (results.all || results.neutral || results.critical) {
      res.render('templates/searchResults', {results: results, hits: hits, terms: terms, documentCount: documentCount});
  } else {
    res.send('No results yet.');
  }
});

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
