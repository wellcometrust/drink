# Alcohol and health

An app that seraches through the ingested data for instances of alcohol related terms, to compare how the thinking about alcohol has changed over time.

## Installation

You will need to have [Node.js](https://nodejs.org/en/) installed, and a [Heroku](https://heroku.com) app created. Add the [Bonsai add-on](https://elements.heroku.com/addons/bonsai) to your Heroku app — Bonsai powers the searches using elasticsearch.

Clone the repository and run `npm install`. 

Create `.env` file in the root of the project. Add the following:

```
BONSAI_URL=xxx
```

Where `xxx` is the URL of your Bonsai add-on URL.

## Running locally

To run the app locally, run

```
heroku local web
```

Restart the process every time you make changes to `index.js`.
