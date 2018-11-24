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

    getProduct(product) {
    }

}


class Emag extends Store {
    constructor() {
        super('Emag');
    }

    getProduct(product, callback) {
        let productName = product['Product Name'];
        console.log('https://www.emag.ro/search/' + encodeURIComponent(productName));
        request.get('https://www.emag.ro/search/' + encodeURIComponent(productName), {json: false}, function (err, res, body) {
            let productListHtml = $('.card-item.js-product-data', '#card_grid', body);
            for (let i = 0; i < productListHtml.length; ++i) {
                let productHtml = productListHtml[i];

                let title = $(productHtml).attr('data-name').trim();
                let price = $('.product-new-price', productHtml).text();
                let store_url = $('.product-title.js-product-url', productHtml).attr('href').trim();
                let image_url = $('img', productHtml).attr('src').trim();

                let values = title.match(/^Telefon mobil (.+?)(?:, (Dual SIM))?(?:, ([0-9]+GB))(?:, (3G|4G))?, (.+)$/i);
                if (values === null) {
                    continue;
                }

                // TODO: Get right one

                callback({store: 'emag', price: price, store_url: store_url, image_url: image_url});
            }

            callback(null);
        });
    }
}


stores = [new Emag()];

let server = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});

    getMatches([{key: 'search', compare: '=', value: 'iphone xr'}, {
        key: 'salePrice',
        compare: '>',
        value: 500
    }], function (json) {
        res.end(JSON.stringify(json));
    })

    // randomCommentByQuery(url.parse(req.url, true).query.q, function (json) {
    //
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


// function queryStringStringify(obj) {
//     let ret = '';
//     for (let i = 0; i < obj.length; ++i) {
//         let filter = obj[i];
//         if (filter.key === 'search') {
//             let values = filter.value.split(' ');
//             for (let i = 0; i < values.length; ++i) {
//                 let val = values[i];
//                 ret += filter.key + '=' + val + '&';
//             }
//         } else {
//             ret += filter.key + filter.compare + filter.value + '&';
//         }
//     }
//
//     ret = ret.substring(0, ret.length - 1);
//
//     return ret;
// }

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

function getProductObj(productDict, callback) {
    let productObj = {};

    // TODO: Get phone info
    productObj.name = 'penis';
    productObj.store_urls = [];

    let c = 0;
    for (let i = 0; i < stores.length; ++i) {
        c++;

        let store = stores[i];
        store.getProduct(productDict, function (storeProduct) {
            if (storeProduct) {
                let storeExists = false;
                for (let i = 0; i < productObj.store_urls.length; ++i) {
                    if (productObj.store_urls[i].store === 'emag') {
                        storeExists = true;
                        break;
                    }
                }

                if (!storeExists)
                    productObj.store_urls.push(storeProduct);
            }

            c--;
            if (c === 0) {
                if (productObj.store_urls.length > 0) {
                    callback(productObj);
                } else {
                    callback(null);
                }
            }
        });
    }
}

function getMatches(filterObj, callback) {
    console.log(filterObj);
    let query = queryStringStringify(filterObj);
    console.log(query);
    bestbuy.products(query, {show: 'name,customerReviewCount,customerReviewAverage,customerTopRated,details.name,details.value,sku'}).then(function (data) {
        let productList = [];

        let products = data.products.map(p => productToDict(p));

        // TODO: More than 3 matches
        console.log(products.length + ' products!!!');
        let c = 0;
        for (let i = 0; i < 3; ++i) {
            c++;

            let product = products[i];
            getProductObj(product, function (productObj) {
                if (productObj) {
                    productList.push(productObj);
                }

                c--;
                if (c === 0) {
                    callback(productList);
                }
            });
        }
    });
}