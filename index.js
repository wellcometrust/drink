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
  res.send('you are looking for ' + req.params.searchTerm);
});

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
