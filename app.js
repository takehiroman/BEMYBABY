var express = require('express');
var app = express();

app.use(express.static('main'));

var port = 3000;
app.listen(port,function(){
    console.log("success!port:%d",port)
});
