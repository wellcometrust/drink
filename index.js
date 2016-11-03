const elasticsearch = require('elasticsearch');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const terms = require('./terms.js').terms;
const sleep = require('sleep');

var connectionString = process.env.BONSAI_URL;
var client = new elasticsearch.Client({
  host: connectionString
});

var getDocumentCount = () => {
  return client.count({
    index: '_all'
  });
}

String.prototype.capitalize = () => {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

// common query together wirh cutoff_frequency and low_freq_operator
// will select the exact phrases and not any of the common words
// found elsewhere
var getResults = (searchTerms) => {
  return client.search({
    body: {
      query: {
        bool: {
          "must": {
            "match": {
              "_all": {
                "query":    "alcohol cirrhosis beer port sherry ale brandy cider whisky whiskey rum wine",
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
    console.log('found ' + resp.hits.total + ' documents');
    results[key] = resp;
    hits = resp.hits.hits;
    hits = hits.reduce(function(a,b){return a.concat(b);});
  }, (err) => {
    console.log(err.message);
  });
};

var hits = [];
var documentCount;
var results = { all: null, neutral: null, critical: null };

fetchResultsFor(terms.all, 'all');
sleep.sleep(1);
fetchResultsFor(terms.neutral, 'neutral');
sleep.sleep(1);
fetchResultsFor(terms.critical, 'critical');

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

app.get('/document/:documentId', (req, res) => {
  client.get({
    index: '_all',
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
