import requests
from urllib.parse import urlencode


class BestBuyProduct:
    def __init__(self, response):
        self.price = response['regularPrice']
        d = {detail['name']: detail['value'] for detail in response['details']}
        self.name = d['Product Name']

        if self.name.endswith('GB'):
            self.name = ' '.join(self.name.split(' ')[:-1])

        self.manufacturer = d['Device Manufacturer']
        self.screen_size = float(d['Screen Size'][0:-7])
        try:
            self.back_camera = float(d['Rear-Facing Camera'][0:-11])
        except KeyError:
            self.back_camera = 5
        try:
            self.front_camera = float(d['Front-Facing Camera'][0:-11])
        except KeyError:
            self.front_camera = 5
        try:
            self.battery = float(d['Maximum Usage Time'][0:-6])
        except KeyError:
            self.battery = 25
        try:
            self.ram = float(d['Phone Memory (RAM)'][0:-10])
        except KeyError:
            self.ram = 2.5

    def __eq__(self, other):
        if isinstance(other, BestBuyProduct):
            return self.name == other.name
        return False

    def __repr__(self):
        return str(self.__dict__)

    def __hash__(self):
        return hash(self.name)


class BestBuy:
    def __init__(self, api_key):
        self.api_key = api_key

    def get_products(self, q):
        ret = []
        for page in range(1, 5):
            response = requests.get('https://api.bestbuy.com/v1/products({})'.format(q),
                                    params={'show': 'details,regularPrice', 'apiKey': self.api_key, 'format': 'json',
                                            'sort': 'customerReviewAverage.desc', 'pageSize': 100, 'page': page})
            try:
                ret.extend([BestBuyProduct(p) for p in response.json()['products']])
            except KeyError as e:
                print('E nasoala treaba men, ', e)
        return list(set(ret))
