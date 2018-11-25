from bestbuy_wrapper import BestBuy
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
import re
from flask import Flask, jsonify, request
from difflib import SequenceMatcher

app = Flask(__name__)


def compare_phones_emag(name, storage, product):
    product_string = product.manufacturer + ' ' + product.name
    if product_string.endswith('GB'):
        name += ' ' + storage

    print(name, ' //// ', product_string)
    return SequenceMatcher(a=name.lower(), b=product_string.lower()).ratio() > 0.6


def compare_phones_cel(name, storage, product):
    product_string = product.manufacturer + ' ' + product.name
    if product_string.endswith('GB'):
        name += ' ' + storage

    # print(name, ' /// ', product_string)
    return name.lower() == product_string.lower()


class Emag:
    phone_pattern = re.compile('^Telefon mobil (.+?)(?:, (Dual SIM))?(?:, ([0-9]+GB))(?:, (3G|4G))?, (.+)$',
                               flags=re.IGNORECASE)

    @classmethod
    def get_store_object(cls, product):
        html = requests.get('https://www.emag.ro/search/' + quote_plus(product.name)).content
        soup = BeautifulSoup(html, 'html.parser')

        products = soup.find_all(class_='card-item js-product-data')
        for product_html in products[:5]:
            title = product_html.get('data-name')
            price = product_html.find(class_='product-new-price').text[0:-6]
            store_url = product_html.find(class_='product-title').get('href')
            image_url = product_html.find('img').get('src')

            if not cls.phone_pattern.match(title):
                continue

            phone_name, dual_sim, storage, network, color = cls.phone_pattern.match(title).groups()
            if compare_phones_emag(phone_name, storage, product):
                return {'store': 'emag', 'price': price, 'store_url': store_url, 'image_url': image_url}
            return None


class Cel:
    phone_pattern = re.compile('^Telefon mobil (.+?)(?: (Dual SIM))?(?: ([0-9]+GB))(?: (3G|4G))? (.+)$',
                               flags=re.IGNORECASE)

    @classmethod
    def get_store_object(cls, product):
        print('http://www.cel.ro/cauta/' + quote_plus(product.name))
        html = requests.get('http://www.cel.ro/cauta/' + quote_plus(product.name)).content
        soup = BeautifulSoup(html, 'html.parser')

        products = soup.find_all(class_='productListingWrapper')
        for product_html in products:
            title = product_html.find(itemprop='name').text
            price = product_html.find(itemprop='price').text
            store_url = product_html.find(class_='productListing-data-b product_link product_name').get('href')
            image_url = product_html.find('img').get('src')

            if not cls.phone_pattern.match(title):
                continue

            phone_name, dual_sim, storage, network, color = cls.phone_pattern.match(title).groups()
            if compare_phones_cel(phone_name, storage, product):
                return {'store': 'cel', 'price': price, 'store_url': store_url, 'image_url': image_url}
            return None


def make_product_json(product):
    ret = {}

    ret['name'] = '{} {}'.format(product.manufacturer, product.name)
    ret['store_urls'] = []

    emag = Emag.get_store_object(product)
    if emag:
        ret['store_urls'].append(emag)

    cel = Cel.get_store_object(product)
    if cel:
        ret['store_urls'].append(cel)

    return ret


@app.route('/products', methods=['POST'])
def post():
    best_buy = BestBuy('NB0Cj7ExAegRczGVuGH38jHW')

    args = request.json

    q = 'details.name=Phone Style&details.value=Smartphone&customerReviewCount>10'

    if args['sim'] == 'yes':
        q += '&details.value=Dual SIM'

    products = best_buy.get_products(q)

    final_list = []
    for prod in products:
        if filter_product(prod, args['size'], args['camera'], args['selfie'], args['battery'], args['ram'],
                          args['price']):
            final_list.append(prod)
            if len(final_list) >= 4:
                break

    return jsonify([pp for pp in [make_product_json(p) for p in final_list] if len(pp['store_urls']) > 0])


def filter_product(p, size, back, front, battery, ram, price):
    if not ((p.screen_size <= 6 and size == 'small') or (p.screen_size >= 5 and size == 'big')):
        return False

    if not ((back == 'meh' and p.back_camera >= 5) or (back == 'high' and p.back_camera >= 8)):
        return False

    if not ((front == 'sometimes' and p.front_camera >= 5) or (front == 'yes' and p.front_camera >= 7)):
        return False

    if not (battery == 'yes' and p.battery >= 20):
        return False

    if not (ram == 'yes' and p.ram >= 3):
        return False

    if not ((price == '500' and p.price * 4 <= 1000) or (price == '1000' and p.price * 4 <= 2000) or (
                    price == '1500' and p.price * 4 <= 3000)):
        return False

    return True


if __name__ == '__main__':
    app.run()

    # best_buy = BestBuy('NB0Cj7ExAegRczGVuGH38jHW')
    # products = best_buy.get_products('details.name=Phone Style&details.value=Smartphone&search=iphone&search=xs')

    # products_json = list(map(make_product_json, list(products)))
    # for p_json in [pj for pj in products_json if pj['store_urls']]:
    #     print(p_json)
