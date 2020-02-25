const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const {startDatabase} = require('./database/mongo')
const jwt = require('express-jwt')
const jwksRsa = require('jwks-rsa')
const {insertAd, getAds, deleteAd, updateAd} = require('./database/ads')
const app = express()

app.use(helmet())

app.use(bodyParser.json())

app.use(cors())

app.use(morgan('combined'))



// ... leave the app definition and the middleware config untouched ...

// replace the endpoint responsible for the GET requests
app.get('/', async (req, res) => {
  res.send(await getAds());
});

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://<AUTH0_DOMAIN>/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    audience: 'express',
    issuer: `https://penncoffee.auth0.com/`,
    algorithms: ['RS256']
  });

app.use(checkJwt)

app.post('/', async (req, res) => {
    const newAd = req.body;
    await insertAd(newAd);
    res.send({ message: 'New ad inserted.' });
  });
  
  // endpoint to delete an ad
  app.delete('/:id', async (req, res) => {
    await deleteAd(req.params.id);
    res.send({ message: 'Ad removed.' });
  });
  
  // endpoint to update an ad
  app.put('/:id', async (req, res) => {
    const updatedAd = req.body;
    await updateAd(req.params.id, updatedAd);
    res.send({ message: 'Ad updated.' });
  });


// start the in-memory MongoDB instance
startDatabase().then(async () => {
  await insertAd({title: 'Hello, now from the in-memory database!'});

  // start the server
  app.listen(3001, async () => {
    console.log('listening on port 3001');
  });
});