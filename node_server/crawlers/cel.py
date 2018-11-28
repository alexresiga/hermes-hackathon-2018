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
        return product_code



if __name__ == '__main__':
   print(Cel.get_product('http://www.cel.ro/telefoane-mobile/telefon-mobil-nokia-3.1-16gb-dual-sim-4g-black-pNiAwMDEq-l/'))