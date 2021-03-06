const express = require('express');
const request = require('request')

const server = express();
server.set('port', 5000);
server.use(express.static(__dirname + '/public'));


server.all("/getServer/*", function(req, res) {
    res.header("Access-Control-Allow-Origin", "*")

    let feedUrl = req.url.split('/getServer/')[1];
    request(feedUrl, function (err, response, body) {
        res.send(body)
    })
});

server.listen(server.get('port'), () => {
    console.log(`Server listening on port ${server.get('port')}`);
})
