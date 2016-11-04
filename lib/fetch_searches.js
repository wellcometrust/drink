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

var getSingleResultFor = (term, source) => {
  var queryTerms = term + '-' + source;
  return SearchResult.findOne({ where: {queryTerms: queryTerms} }).then(result => {
    if (!result) {
      return searchClient.search({
        body: {
          size: 30,
          query: {
            bool: {
              "must": {
                "match": {
                  "_all": term
                  }
                }
              },
            }
          },
          "highlight" : {
            require_field_match: false,
            "pre_tags" : ["<b>"],
            "post_tags" : ["</b>"],
            "fields" : {
              "*" : {}
            }
          },
          index: source
      }).then(resp => {

        if (resp) {
          SearchResult.sync().then(() => {
            return SearchResult.create({
              queryTerms: queryTerms,
              result: resp
            });
          });
        }

      });
    } else {
      console.log('found ' + term + ' in the database.')
      return Promise.resolve(null);
    }
  });
};
var getSingleResult = (term) => {
  return SearchResult.findOne({ where: {queryTerms: term} }).then(result => {
    if (!result) {
      return searchClient.search({
        body: {
          size: 30,
          query: {
            bool: {
              "must": {
                "match": {
                  "_all": {
                    "query":    term,
                    "operator": "or",
                    "fuzziness": 0.5
                  }
                }
              },
            }
          },
          "highlight" : {
            "order": "score",
            "number_of_fragments": 15,
            require_field_match: false,
            "pre_tags" : ["<b>"],
            "post_tags" : ["</b>"],
            "fields" : {
              "*" : {}
            }
          }
        }
      }).then(resp => {

        if (resp) {
          SearchResult.sync().then(() => {
            return SearchResult.create({
              queryTerms: term,
              result: resp
            });
          });
        }

      });
    } else {
      console.log('found ' + term + ' in the database.')
      return Promise.resolve(null);
    }
  });
};

var getResults = (searchTerms, name) => {
  return SearchResult.findOne({ where: {queryTerms: name} }).then(result => {
    if (!result) {
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
    } else {
      console.log('found results in the database.')
      return Promise.resolve(null);
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
  getResults(terms.all, 'all').then(resp => {
    if (resp) {
      SearchResult.sync().then(() => {
        return SearchResult.create({
          queryTerms: 'all',
          result: resp
        });
      });
    }
    return getResults(terms.neutral, 'neutral');
  }).then(resp => {
    if (resp) {
      SearchResult.sync().then(() => {
        return SearchResult.create({
          queryTerms: 'neutral',
          result: resp
        });
      });
    }
    return getResults(terms.critical, 'medical');
  }).then(resp => {
    if (resp) {
      SearchResult.sync().then(() => {
        return SearchResult.create({
          queryTerms: 'medical',
          result: resp
        });
      });
    }
  }).catch(err => {
    console.log(err.message);
    console.log(err.stack);
  });
};

module.exports.fetchDocumentCount = fetchDocumentCount;
module.exports.fetchTermsResults = fetchTermsResults;
module.exports.fetchSingleResult = getSingleResult;
module.exports.fetchSingleResultFor = getSingleResultFor;
