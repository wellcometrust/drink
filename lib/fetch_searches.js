const searchClient = require('./search.js');
const db = require('./db.js').db;
const SearchResult = require('./db.js').SearchResult;
const SearchMetadata = require('./db.js').SearchMetadata;
const terms = require('../terms.js').terms;

var getDocumentCount = () => {
  return searchClient.count({
    index: '_all'
  });
}

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

var fetchDocumentCount = () => {
  SearchMetadata.findOne({ where: { name: 'documentCount' } }).then(documentCount => {
    if (!documentCount) {
      console.log('fetching document count from elasticsearch');
      getDocumentCount().then(resp => {
        if (!resp.count) return;
        console.log('total document count: ', resp.count);
        return SearchMetadata.create({
          name: 'documentCount',
          content: resp.count + ''
        });
      }, (err) => {
        console.log(err.message);
      });
    } else {
      console.log('found document count in the database');
    }
  });
};

var fetchTermsResults = () => {
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
};

module.exports.fetchDocumentCount = fetchDocumentCount;
module.exports.fetchTermsResults = fetchTermsResults;

