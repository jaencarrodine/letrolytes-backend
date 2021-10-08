const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.sendgrid_key1)

const client = require('@sendgrid/client')
client.setApiKey(process.env.sendgrid_key1)

const mongo = require('mongodb');

const express = require('express');
const e = require('express');
const router = express.Router();
const getPrices = require('../API-Functions/getPrices')
const getBestPrice = require('../API-Functions/getBestPrice')

router.post('/activate-follow-up', async(req, res)=>{
    try{
        
        //check if email already acitvated this session
        //if no activate email and add to session that email was activated
        //if yes dont activate a new email

        //get request info
        const requestInfo = req.body
        console.log(requestInfo)

        let o_id = new mongo.ObjectID(requestInfo.id)
        const mongodb = req.app.locals.mongodb
        const users = await mongodb.db("nosebuttrDB").collection("users");
        const userInfo = await users.findOne({_id:o_id})
        let followUpActivated = userInfo.sessions[requestInfo.currentSession].followUpActivated
        res.send("success")
        if(!followUpActivated){
            
            let info = req.body
            //console.log(info)
            let dateObj = new Date()
            const session = `session_${dateObj.getUTCMonth()}/${dateObj.getUTCDate()}/${dateObj.getUTCDate()}`
            //console.log(info)
            let updatedSessionInfo 
            let newSessionInfo
            if(o_id !== undefined){
                updatedSessionInfo  = await users.updateOne({_id:o_id},{$set: {["sessions."+session+".followUpActivated"]:true}},{upsert:true})
 
            }
        
            console.log('followup email activated')
            
           
            await new Promise(resolve => setTimeout(resolve, /*1800000*/3));

            


            const email = userInfo.email
            const productClicks = userInfo.sessions[requestInfo.currentSession].events
            const recommendedProducts = userInfo.sessions[requestInfo.currentSession].recommendedProducts
            let productType = requestInfo.productType
            if(productType === "Snowboards"){
                productType = "SNOWBOARD"
            }else if(productType === "Skis"){
                productType = "SKIS"
            }
            //Add user to contacts
            await addContact(productType, email)
            //filter products out of product clicks
            let products = {}
            if(productClicks !== undefined){
                for(const event of productClicks){
                    if(!(Object.keys(products).includes(event.product))){
                        products[event.product] = event
                    }
                }
            }
        
            if(recommendedProducts !== undefined){
                
                for(const event of recommendedProducts){
                    
                    if(!(Object.keys(products).includes(event.name))){//add top 3 results to array 
                        let name = event.name.replace('Snowboard','')
                        products[name] = event
                    }
                }
            }
            let prices = []
            //loop array calling getPrices function for each 
            console.log(products)
            for(const product in products){
                let price = await getPrices.getPrices(mongodb,products[product].product || products[product].name, products[product].company, productType.toUpperCase())
                price = price.filter(p =>{
                    if(!p.fromSearch){
                        return p
                    }else if(p.score > 6){//not from search or score greater than 6
                    return p 
                    }
                })

                price = getBestPrice(price)
                prices.push(price)
            }

            
            console.log(prices)

            prices = prices.filter(item =>{
                if(item !== undefined){
                    return item
                }
            })
            
            //get best price and link for each
            //update template for only one loop
            let productTypePlural 
            if(productType === "SNOWBOARD"){
                productTypePlural = "snowboards"
            }if(productType === "SKIS"){
                productTypePlural = 'skis'
            }

            let data = {
                productType:productType.toLowerCase(),
                productTypePlural:productTypePlural,
                prices:prices
            }

            const testData = {
                "productType":"snowboard",
                "productClicks":[{"productName":"Burton custom", "price":"100", "merchantName":"evo"}, {"productName":"Burton custom", "price":"100", "merchantName":"evo"}]
            }
            const msg = {
            from: {
                email:'Jaen@nosebuttr.com', // Change to your verified sender
                name:"Jaen from NoseButtr",
            },
            personalizations:[
                {
                    to:[
                        {email:email}
                    ],
                    //bcc:[{email:"jaen@nosebuttr.com"}],
                    dynamic_template_data:data
                }
            ],
            template_id:"d-96d2fc5a2b1d4961aa8bb74b59a24557",
            
            }
            sgMail
            .send(msg)
            .then(() => {
                console.log('Email sent')
                
            })
            .catch((error) => {
                console.error(error)
                console.log(error.response.body)
            })
        }else{
            console.log("follow up email already activated this session")
        }
        
       
        
    }catch(e){
        console.log("error sending email:",e)
    }
})

router.get('/test-contacts', async(req,res)=>{
    /* un comment to get list ids
    const request = {
        method: 'GET',
        url: '/v3/marketing/lists',
      
      };
      client.request(request)
      .then(([response, body]) => {
        console.log(response.statusCode);
        console.log(body);
      })*/
    await addContact('SKIS','jaencarrodine@gmail.com')
    res.send('success')
})


router.get('/add-mongo-contacts', async(req,res)=>{
    const mongodb = req.app.locals.mongodb
    const users = await mongodb.db("nosebuttrDB").collection("users");
    const allUsers = await users.find({}).toArray()
    for(const user of allUsers){
        let email = user.email
        let quizType
        for(const session in user.sessions){
            let quizSubmission = user.sessions[session].quizSubmission
            if(quizSubmission !== undefined){
                quizType = quizSubmission[0].answer
            }
           
        }
        const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        let valid =  re.test(email);
        if(valid){
            console.log(email)
            console.log(quizType)
            await addContact(quizType, email)
        }
       

    }
    res.send('success')
})

async function addContact(productType,email){
    try{
        const lists = {
            "SNOWBOARD":'a8fba06a-d197-42f9-a7fd-1866d19dfed0',
            "SKIS":"ce417dd5-a23c-4fe0-9b40-208ca2150952",
            "Snowboards":'a8fba06a-d197-42f9-a7fd-1866d19dfed0',
            "Skis":"ce417dd5-a23c-4fe0-9b40-208ca2150952",
        }
        let listId = lists[productType]
        console.log(listId)
        const request = {
            method: 'PUT',
            url: '/v3/marketing/contacts',
            body:{
                "list_ids":[listId],
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