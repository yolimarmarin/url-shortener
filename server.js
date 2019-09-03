var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var cors = require("cors");
var dns = require("dns");
var app = express();

var port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("/public"));
app.get("/", (req,res)=>{
  res.sendFile(__dirname + "/public/index.html");
});

mongoose.connect(process.env.URL_SHORT,{useNewUrlParser: true});
mongoose.connection.once('open', function(){
      console.log('Conection has been made!');
    }).on('error', function(error){
        console.log('Error is: ', error);
    });

var Schema = mongoose.Schema;
var urlSchema = new Schema({
  originalUrl: {type:String, require:true},
  shortUrl: {type:String, require:true}
});
var Url = mongoose.model("Url",urlSchema);


app.get("/api/shorturl/new/:test(*)", (req,res)=>{
  
  var urlToShort = req.params.test;
  
  //var regex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi; IF THE  HTTP(S) PROTOCOL IS NOT REQUIRED
  //TO ENSURE THE HTTP(S) PROTOCOL
    var regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  
    if(regex.test(urlToShort)){
      
    var urlHttp = new RegExp("^(http|https)://","i");
    
    //REMOVING THE HTTP(S) FROM THE URL SO THE LOOKUP DOENS'T THROW AN ERROR 
    //BECAUSE IT TAKES A HOSTNAME AS A PARAMATER AND THAT DOES NOT INCLUDES PROTOCOLS
    var aux = urlToShort;
    aux = aux.replace(urlHttp,"");
    
    //MAKING SURE THAT THE URL PROVIDED POINTS TO A VALID SITE
    dns.lookup(aux, (err, address, family)=>{
      
    if(err){
      return res.json({"error":"Submitted URL doesn't points to a valid site"});
    }
      
      var shortURL = Math.floor(Math.random()*1000).toString();
      var data = new Url;
      data.originalUrl = urlToShort;
      data.shortUrl = shortURL;
    
      data.save(function(err,data){
        if(err){
          console.log(err);
          return "there is an error";
        }else{
          console.log("data saved");
        }
      }); 

        return res.json({"Original URL":urlToShort, "Short URL":shortURL});
      });
      
      }else{
        return res.json({"error": "invalid URL"});
      }  
});

app.get("/api/shorturl/:redirectUrl?", (req,res,next)=>{
  var urlReq = req.params.redirectUrl;
  Url.findOne({shortUrl:urlReq}, function(err,data){
    if(err){
      return "error";
    }
    return res.redirect("301",data.originalUrl);
    /* USE THIS CODE IF YOU DIDN´T REQUIRE THE HTTP(S) PROTOCOL EARLIER....THIS IS NECESSARY BECAUSE .redirect REQUIRES IT 
    var reg = new RegExp("^(http|https)://","i"); 
    if(reg.test(data.originalUrl)){
      return res.redirect("301",data.originalUrl);
    }else{
      return res.redirect("301", "http://"+data.originalUrl);
    }*/
  }); 

  
  
});


app.listen(port, ()=>{
  console.log("Everything OK");
});
