require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');
let mongoose = require('mongoose');
mongoose.set('strictQuery', false);


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended:false}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const Schema = mongoose.Schema;

const linkSchema = new Schema({
  address: {
    type: String,
    required: true,
  },
  list: Number,
});

let link = mongoose.model('links', linkSchema);

app.post('/api/shorturl', (req, res) => {
  let url = req.body.url;

  dns.lookup(urlParser.parse(url).hostname, async(err, address, family) => {
    if (!address || !family){
      return res.json({
        'error': 'Invalid URL'
      })
    }
    link = await link.findOne({
      address: url
    }).exec();

    if (link !== null){
      return res.json({
        original_url: link.address,
        short_url: link.list
      });
    }

    let count = await link.find().countDocuments();

    let newLink = new link({
      address: url,
      list: count + 1,
    })
    newLink.save();

    return res.json({
      original_url:newLink.address,
      short_url: newLink.list
    });
  });
});

app.get('/api/shorturl/:short_url', async function(req, res){
  let short_url = Number(req.params.short_url);

  let link = await link.findOne({
    list: short_url
  }).exec();

  res.redirect(link.address);
});

app.get('/test', function (req, res){
  const mySecret = process.env['password']
  res.send(mySecret);
})

let MONGO_URI =
'mongodb+srv://ammarul21052:Jatmik022@cluster0.qvvycy7.mongodb.net/?retryWrites=true&w=majority';
;

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    app.listen(port, function(){
      console.log('Listening on port ${port}');
    });
  }catch(e){
    console.log(e.message)
  }
}

start();

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
