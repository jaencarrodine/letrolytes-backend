const express = require('express')
const app = express()
const port = process.env.PORT || 4000
const bodyParser = require('body-parser');

require('dotenv/config')


app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*"); // disabled for security on local
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
})

app.use(bodyParser.json())


//connect to db
/*
const assert = require('assert')
const mongo = require('mongodb');

const MongoClient = require('mongodb').MongoClient;
const v2url = process.env.DB_connectionV2
var mongodb
// Create the db connection
MongoClient.connect(v2url,{  
    poolSize: 10, useUnifiedTopology: true }, function(err, db) {  
    assert.equal(null, err);
    mongodb=db;
    app.locals.mongodb=db
    }
);
*/








//routes 

const example = require (('./routes/example'))
const sendgridExample = require(('./routes/sendgrid-example'))

app.use('/sendgrid', sendgridExample)
app.use('/example',example)




app.listen(port, () => console.log(`letrolytes backend listening at http://localhost:${port}`))