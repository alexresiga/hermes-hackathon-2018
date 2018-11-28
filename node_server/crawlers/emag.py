import re
from threading import Thread

import requests
from bs4 import BeautifulSoup

from node_server.model.product import Product


class Emag:
    def __init__(self):
        self.url = 'https://www.emag.ro'

    def get_products(self, page):
        response = requests.get(self.url + page)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        product_pages = [obj.get('href') for obj in soup.find_all(class_='product-title js-product-url')]
        return product_pages

    def get_product(self, url):
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


lst = []


def thread(emag, url):
    lst.append(emag.get_product(url))


if __name__ == '__main__':
    emag = Emag()
    print('Getting product urls...')
    product_urls = emag.get_products('/telefoane-mobile/c')
    threads = []
    for p_url in product_urls:
        threads.append(Thread(target=thread, args=(emag, p_url)))

    for t in threads:
        t.start()

    for t in threads:
        t.join()

    print([x[1] for x in lst])
    # print(emag.get_product(
    #  'https://www.emag.ro/telefon-mobil-samsung-galaxy-j4-2018-dual-sim-32gb-4g-black-sm-j415fzkgrom/pd/DVPPVVBBM/').__dict__)
    # print(emag.get_products('/telefoane-mobile/c').__dict__)
