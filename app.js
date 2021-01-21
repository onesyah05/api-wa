
const { Client } = require('whatsapp-web.js');
const express = require('express');
const unirest = require('unirest');
var axios = require('axios');
// const { body, validationResult } = require('express-validator');
const bodyParser = require('body-parser')
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const translate = require('translate-api');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const SESSION_FILE_PATH = './wa-session.json';
let sessionCfg;
if(fs.existsSync(SESSION_FILE_PATH)){
    sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({ puppeteer : {headless:true},session:sessionCfg});

client.on('qr', qr => {
    qrcode.generate(qr,{small: true});
});

client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg=session;
    fs.writeFile(SESSION_FILE_PATH,JSON.stringify(session),function(err){
        if(err){
            console.log(err);
        }
    })
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', message => {
  console.log(message.mentionedIds);
  console.log("["+message.id.id+"] "+message.from +" -> "+ message.body)
  let cek = message.body;

  if(cek.search("Terjemah") != -1){
    // message.reply('pong');
    
    let pesan = message.body;
    pesan = pesan.split("|")

    console.log(pesan)
    var qs = require('qs');
    var data = qs.stringify({
      
    });
    var config = {
      method: 'get',
      url: 'https://google-translate-proxy.herokuapp.com/api/languages',
      headers: { },
      data : data
    };
    let from ="";
    let to = "";
    
    axios(config)
    .then(function (response) {
      for (let i = 0; i < response.data.length; i++) {
        v = response.data;
        if(v[i]['name'] == pesan[1]){
          from = v[i].code
          console.log(v[i].code)
        }else if(v[i]['name'] == pesan[2]){
          to = v[i].code
          console.log(v[i].code)
        }else{
          continue;
        }
        
      }
      console.log(from)
    console.log(to)
    let url ='https://google-translate-proxy.herokuapp.com/api/translate?query='+pesan[3].replace(" ", "%20")+'&targetLang='+to+'&sourceLang='+from;
    console.log(url)
    var config1 = {
      method: 'get',
      url: url,
      headers: { },
      data : data
    };
    
    axios(config1)
    .then(function (response) {
      message.reply(response.data.extract.translation);
      message.reply("Terjemahan dari : "+response.data.extract.actualQuery);
    })
    .catch(function (error) {
      console.log(error);
    });
    })
    .catch(function (error) {
      console.log(error);
    });
    
  }
	if(message.body === '!ping') {
        message.reply('pong');
        client.sendMessage(message.from, 'pong');
  }
  if(message.body === 'p' || message.body === 'P') {
    message.reply('Kenapa harus '+message.body);
    client.sendMessage(message.from, 'Penjelasan Huruf P');
    let pesan = 'Huruf *P* tunggal pada pesan Whatsapp (WA) \natau Line tampaknya singkatan dari *ping* (dering pendek dan tinggi) yang diwarisi dari era Blackberry Messenger (BBM). Di BBM, *ping* umumnya dipakai untuk meminta perhatian dalam kondisi mendesak. Perhatian mestinya jangan diminta';
    client.sendMessage(message.from, pesan);
  }
  if(message.body === 'F' || message.body === 'f') {
    message.reply('Biasanya manusia normal menggunakan P');
  
  }
});
app.post('/send-message', (req, res) => {
    console.log(req.body);
  
    client.sendMessage(req.body.number, req.body.message).then(response => {
      res.status(200).json({
        status: true,
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
      console.log(err)
    });
});


client.initialize();

app.listen(5000,function(){
    console.log('App running om *: '+5000);
})