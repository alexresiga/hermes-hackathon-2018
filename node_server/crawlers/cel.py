import re

import requests
from bs4 import BeautifulSoup


class Cel:
    base_url = 'http://www.cel.ro'

    @staticmethod
    def get_products(page):
        try:
            response = requests.get(Cel.base_url + page)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')
            product_pages = [obj.get('href') for obj in
                             soup.find_all(class_='productListing-data-b product_link product_name')]
            return product_pages
        except requests.exceptions.HTTPError as e:
            print(e)

    @staticmethod
    def get_product(url):
        response = requests.get(url)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        product_code = soup.find(id='cod').text.strip()

        price_table = soup.find(id='pret_tabela')
        current_price = float(price_table.find(class_='productPrice').text.strip())
        try:
            old_price = float(re.search('pret vechi ([0-9]+) lei', price_table.find(class_='c_online').text.strip(),
                                        flags=re.IGNORECASE).group(1))
        except AttributeError:
            old_price = None

        return product_code, (current_price, old_price)
