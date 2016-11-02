const elasticsearch = require('elasticsearch');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const terms = require('./terms.js').terms;

var connectionString = process.env.BONSAI_URL;
var client = new elasticsearch.Client({
  host: connectionString
});

// common query together wirh cutoff_frequency and low_freq_operator
// will select the exact phrases and not any of the common words
// found elsewhere
var getResults = (searchTerms) => {
  return client.search({
    body: {
      query: {
        common: {
          "_all": {
            query: searchTerms.join(','),
            "cutoff_frequency": 0.001,
            "low_freq_operator": "or"
          }
        }
      },
      "highlight" : {
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

var fetchResultsFor = (searchTerms, key) => {
  getResults(searchTerms).then((resp) => {
    console.log(resp);
    results[key] = resp;
    hits = resp.hits.hits;
    hits = [].concat.apply([], hits);
    console.log(hits)
  }, function (err) {
    console.log(err.message);
  });
};

var hits = [];
var results = { all: null, neutral: null, critical: null };

fetchResultsFor(terms.all, 'all');
fetchResultsFor(terms.neutral, 'neutral');
fetchResultsFor(terms.critical, 'critical');

app.set('port', port);

app.engine('html', require('hogan-express'));
app.set('layout', 'layouts/app')
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  if (results.all) {
    res.render('templates/searchResults', {results: results, hits: hits, terms: terms});
  } else {
    res.send('No results yet.');
  }
});

app.get('/document/:documentId', (req, res) => {
  client.get({
    index: 'moh',
    type: '_all',
    id: req.params.documentId
  }).then((resp) => {
    console.log(resp);
    res.render('templates/searchResult', {data: resp});
  }, (err) => {
    console.log(err.message);
    res.send(err.message);
  });
});

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
