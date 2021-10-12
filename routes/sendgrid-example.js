const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.sendgrid_key1)

const client = require('@sendgrid/client')
client.setApiKey(process.env.sendgrid_key1)

const mongo = require('mongodb');

const express = require('express');

const router = express.Router();






router.post('/add-contact', async(req,res)=>{
    const email = req.body.email

  
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    let valid =  re.test(email);
    if(valid){
        console.log(email)
        await addContact(email)
    }
       

    
    res.send('success')
})

router.get('/test', async(req,res)=>{
    const msg = {
        to: 'jaencarrodine@gmail.com', // Change to your recipient
        from: 'drinkbender@gmail.com', // Change to your verified sender
        subject: 'Sending with SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
      }
      sgMail
        .send(msg)
        .then(() => {
          console.log('Email sent')
        })
        .catch((error) => {
          console.error(error.response.body)
        })
    res.send('call made')
})

async function addContact(email){
    try{
      console.log('adding contact')
        
        const request = {
            method: 'PUT',
            url: '/v3/marketing/contacts',
            body:{
                "contacts":[
                    {
                        "email": email,
                        //"custom_fields":{"quiz_type":productType}
                    }
                ]
            }
          };
          client.request(request)
          .then(([response, body]) => {
            console.log(response.statusCode);
            console.log(body);
          })
    }catch(e){
        console.log('error in add contact function',e)
    }
}
module.exports = router