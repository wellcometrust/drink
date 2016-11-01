const elasticsearch = require('elasticsearch');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let connectionString = process.env.BONSAI_URL;

let searchTerms = [ 'abstaine',
  'abstinence',
  'abuse',
  'alcohol',
  'alcoholic',
  'anstie',
  'anstie’s Limit',
  'beer',
  'cider',
  'cirrhosis of the liver',
  'craving',
  'delirium tremens',
  'dram',
  'drink',
  'drinker',
  'drunkard',
  'excess',
  'grocers',
  'habit',
  'habitual',
  'inebriety',
  'intemperance',
  'intemperate',
  'licensed Victuallers',
  'liquor',
  'liquor trade',
  'liver disease',
  'moderate',
  'moderation',
  'nourishing' ];

let client = new elasticsearch.Client({
  host: connectionString
});

app.set('port', port);

app.engine('html', require('hogan-express'));
app.set('layout', 'layouts/app')
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {

  client.search({
    q: searchTerms.join(',')
  }).then(function (resp) {
    console.log(resp.hits.hits[0]);
    res.render('templates/searchResults', {data: resp, searchTerms: searchTerms});
  }, function (err) {
    console.log(err.message);
    res.send(err.message);
  });
});

app.listen(port, () => {
  console.log('Example app listening on port ' + port);
});
