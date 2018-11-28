import re

import requests
from bs4 import BeautifulSoup

from node_server.crawlers.cel import Cel
from node_server.utils.woker_threads import WorkerPool


class Emag:
    base_url = 'https://www.emag.ro'

    @staticmethod
    def get_products(page):
        try:
            response = requests.get(Emag.base_url + page)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')
            product_pages = [obj.get('href') for obj in soup.find_all(class_='product-title js-product-url')]
            return product_pages
        except requests.exceptions.HTTPError as e:
            print(e)

    @staticmethod
    def get_product(url):
        response = requests.get(url)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        try:
            product_code = re.match('Cod produs: (.+)', soup.find(class_='product-code-display').text.strip()).group(1)

            phone_name = re.match('^Telefon mobil (.+?)(?:, (Dual Sim))?(?:, ([0-9]+GB))(?:, (3G|4G))?(?:, (.+))$',
                                  soup.find(class_='page-title').text.strip(), flags=re.IGNORECASE).group(1)

        except AttributeError:
            return

        specs = {}
        for row in soup.find(id='specification-section').parent.find_all('tr'):
            key, value = map(lambda x: x.text.strip(), row.find_all('td'))
            if len(value.split('\n')) > 1:
                value = value.split('\n')
            specs[key] = value

        return product_code, phone_name, specs


if __name__ == '__main__':
    print('Getting emag product urls...')
    emag_product_urls = Emag.get_products('/telefoane-mobile')

    print('Getting cel product urls...')
    cel_product_urls = Cel.get_products('/telefoane-mobile')

    emag_products = WorkerPool(emag_product_urls, Emag.get_product).get_results()
    cel_products = WorkerPool(cel_product_urls, Cel.get_product).get_results()

    phones = {}
    for p in emag_products + cel_products:
        p_code = p[0].upper()
        if p_code not in phones:
            phones[p_code] = []
        phones[p_code].append(p)

    for k, v in phones.items():
        print(k, len(v))