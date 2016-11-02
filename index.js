const elasticsearch = require('elasticsearch');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const terms = require('./terms.js').terms;

var connectionString = process.env.BONSAI_URL;
var client = new elasticsearch.Client({
  host: connectionString
});

var results;

// common query together wirh cutoff_frequency and low_freq_operator
// will select the exact phrases and not any of the common words
// found elsewhere
var getResults = () => {
  return client.search({
    body: {
      query: {
        common: {
          "_all": {
            query: terms.all.join(','),
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

getResults().then((resp) => {
  console.log(resp)
  results = resp;
}, function (err) {
  console.log(err.message);
});

app.set('port', port);

app.engine('html', require('hogan-express'));
app.set('layout', 'layouts/app')
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {

  if (results) {
    res.render('templates/searchResults', {data: results, searchTerms: searchTerms});
  } else {
    res.send('No results yet.');
  }
});

app.get('/document/:documentId', (req, res) => {
  client.get({
    index: 'moh',
    type: '_all',
    id: req.params.documentId
  }).then(function (resp) {
    console.log(resp);
    res.render('templates/searchResult', {data: resp});
  }, function (err) {
    console.log(err.message);
    res.send(err.message);
  });
});

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
