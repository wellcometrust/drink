const elasticsearch = require('elasticsearch');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

var connectionString = process.env.BONSAI_URL;

var client = new elasticsearch.Client({
  host: connectionString
});

app.set('port', port);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/:searchTerm', (req, res) => {
  client.search({
    index: '_all',
    type: 'document',
    body: {
      query: {
        query_string:{
         query: req.params.searchTerm
        }
      }
    }
  }).then(function (resp) {
    console.log(resp);
    res.send(resp);
  }, function (err) {
    console.log(err.message);
    res.send(err.message);
  });
});

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
