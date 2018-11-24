const http = require('http');
const url = require('url');
const Enum = require('enum');
const bestbuy = require('bestbuy')('NB0Cj7ExAegRczGVuGH38jHW');
const request = require('request');
const $ = require('cheerio');


const gadgetType = new Enum([
    'Phone',
    'Laptop',
    'Computer',
    'Headphones',
    'Mouse',
    'Keyboard',
    'Monitor',
    'Smartwatch']);

class Store {
    constructor(name) {
        this.name = name;
    }

    hasProduct(product) {
    }

}


class Emag extends Store {
    constructor() {
        super('Emag');
    }

    getProduct(product) {
        let productName = product['Product Name'];
        console.log('https://www.emag.ro/search/' + encodeURIComponent(productName));
        request.get('https://www.emag.ro/search/' + encodeURIComponent(productName), {json: false}, function (err, res, body) {
            let productList = $('.card-item.js-product-data', '#card_grid', body);
            console.log(productList.length);
        });
    }
}


let server = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});

    getMatches([{key: 'search', compare: '=', value: 'iphone xr'}, {
        key: 'salePrice',
        compare: '>',
        value: 500
    }], function (data) {
        let products = data.products;
        products.sort(compareRatings);
        console.log(products[0].details);
        // console.log(data[0].features);
    })

    // randomCommentByQuery(url.parse(req.url, true).query.q, function (json) {
    //     res.end(JSON.stringify(json));
    // });
});

const port = process.env.PORT || 3000;
server.listen(port);


function compareRatings(a, b) {
    if (a.customerTopRated && !b.customerTopRated) {
        return -1;
    } else if (b.customerTopRated && !a.customerTopRated) {
        return 1;
    } else if (a.customerReviewAverage > b.customerReviewAverage) {
        return -1;
    } else if (a.customerReviewAverage < b.customerReviewAverage) {
        return 1;
    }

}


function queryStringStringify(obj) {
    let ret = '';
    for (let i = 0; i < obj.length; ++i) {
        let filter = obj[i];
        if (filter.key === 'search') {
            let values = filter.value.split(' ');
            for (let i = 0; i < values.length; ++i) {
                let val = values[i];
                ret += filter.key + '=' + val + '&';
            }
        } else {
            ret += filter.key + filter.compare + filter.value + '&';
        }
    }

    ret = ret.substring(0, ret.length - 1);

    console.log(ret);
    return ret;
}

function findInStores(product) {

}

function productToDict(product) {
    let ret = {};
    let details = product.details;
    for (let i = 0; i < details.length; ++i) {
        let detail = details[i];
        ret[detail.name] = detail.value;
    }
    return ret;
}

function getMatches(filterObj, callback) {
    console.log(filterObj);
    let query = queryStringStringify(filterObj);
    bestbuy.products(query, {show: 'name,customerReviewCount,customerReviewAverage,customerTopRated,details.name,details.value,features.feature,sku'}).then(function (data) {
        let products = data.products.map(p => productToDict(p));
        let emag = new Emag();
        emag.hasProduct(products[0]);
    });
}