const http = require('http');
const url = require('url');
const Enum = require('enum');
const bestbuy = require('bestbuy')('NB0Cj7ExAegRczGVuGH38jHW');


const gadgetType = new Enum(['Phone',
                             'Laptop',
                             'Computer',
                             'Headphones',
                             'Mouse',
                             'Keyboard',
                             'Monitor',
                             'Smartwatch'])

let server = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    
    bestbuy.products('search=oven&search=stainless&search=steel',{show:'sku,name,salePrice'}).then(function(data) {
        console.log(data);
    });

    // randomCommentByQuery(url.parse(req.url, true).query.q, function (json) {
    //     res.end(JSON.stringify(json));
    // });
});

const port = process.env.PORT || 3000;
server.listen(port);
