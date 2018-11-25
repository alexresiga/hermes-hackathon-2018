const http = require('http');
const url = require('url');
const Enum = require('enum');
const bestbuy = require('bestbuy')('NB0Cj7ExAegRczGVuGH38jHW');
const request = require('request');
const $ = require('cheerio');
const queryString = require('querystring');


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

                if (!Emag.comparePhones(values, product)) {
                    continue;
                }

                callback({store: 'emag', price: price, store_url: store_url, image_url: image_url});
            }

            callback(null);
        });
    }

    static comparePhones(values, product) {
        let emagTitle = values[1];

        let productName = product['Product Name'];
        productName = product['Device Manufacturer'] + ' ' + productName;
        if (productName.endsWith('GB')) {
            emagTitle = emagTitle + ' ' + values[3];
        }

        // console.log(emagTitle + '///' + productName);
        return (emagTitle.toLowerCase() === productName.toLowerCase())
    }
}

class Altex extends Store {
    constructor() {
        super('Altex');
    }

    getProduct(product, callback) {
        let productName = product['Product Name'];

        console.log('https://altex.ro/cauta/?q=' + encodeURIComponent(productName));
        request.get('https://altex.ro/cauta/?q=' + encodeURIComponent(productName), {json: false}, function (err, res, body) {
            let productListHtml = $('.Products-item', body);
            console.log(productListHtml.length);
            for (let i = 0; i < productListHtml.length; ++i) {
                let productHtml = productListHtml[i];

                let title = $('.Product-name', productHtml).text().trim();
                let price = $('.Price-int', productHtml).text();
                let store_url = $('.Product-name', productHtml).attr('href').trim();
                let image_url = $('.Product-photo', productHtml).attr('src').trim();

                let values = title.match(/^Telefon (.+?)(?: |, )([0-9]+GB)(?: |, )(.+)$/i);
                if (values === null) {
                    console.log(title);
                    continue;
                }
                console.log(values);
                if (!Altex.comparePhones(values, product)) {
                    continue;
                }

                callback({store: 'altex', price: price, store_url: store_url, image_url: image_url});
            }
        });
    }

    static comparePhones(values, product) {
        let altexTitle = values[1];

        let productName = product['Product Name'];
        productName = product['Device Manufacturer'] + ' ' + productName;
        if (productName.endsWith('GB')) {
            altexTitle = altexTitle + ' ' + values[2];
        }

        //console.log(altexTitle + '///' + productName);
        return (altexTitle.toLowerCase() === productName.toLowerCase())
    }
}


stores = [new Altex(), new Emag()];

let server = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});

    getMatches(
        {
            'details.name': 'Phone Style',
            'details.value': 'Smartphone'
        }, function (json) {
            res.end(JSON.stringify(json));
        });

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


function stringifyQuery(obj) {
    let ret = '';
    for (let key in obj) {
        o = {};
        o[key] = obj[key];
        ret += queryString.stringify(o, eq = '=') + '&';
    }

    return ret.substring(0, ret.length - 1);
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

function getProductObj(productDict, callback) {
    let productObj = {};

    // TODO: Get phone info
    productObj.name = productDict['Device Manufacturer'] + ' ' + productDict['Product Name'];
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

function inList(p, list) {
    for (let i = 0; i < list.length; ++i) {
        if (p['Product Name'] === list[i]['Product Name'])
            return true;
    }
    return false;
}

function getMatches(filterObj, callback) {
    console.log(filterObj);

    let query = stringifyQuery(filterObj);

    console.log(query);
    bestbuy.products(query, {
        show: 'name,customerReviewAverage,customerTopRated,details',
        pageSize: 50
    }).then(function (data) {
        let productList = [];

        let products = data.products.map(p => productToDict(p));
        let uniqueProducts = [];

        for (let i = 0; i < products.length; ++i) {
            if (!inList(products[i], uniqueProducts))
                uniqueProducts.push(products[i]);
        }

        // TODO: More than 3 matches
        console.log(uniqueProducts.length + ' products!!!');
        let c = 0;
        for (let i = 0; i < uniqueProducts.length; ++i) {
            c++;

            let product = uniqueProducts[i];
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