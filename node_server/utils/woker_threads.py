from queue import Queue
from threading import Thread

N_THREADS = 8


class WorkerPool:
    def __init__(self, lst, f, *args):
        self.q = Queue()
        self.results = []

        for item in lst:
            self.q.put(item)

        self.f = f
        self.args = args

    def get_results(self):
        self.start_workers()
        self.q.join()
        self.stop_workers()

        return self.results

    def worker_thread(self):
        while True:
            item = self.q.get()
            if item is None:
                break
            result = self.f(item, *self.args)
            if result:
                self.results.append(result)

    def start_workers(self):
        for _ in range(N_THREADS):
            Thread(target=self.worker_thread, args=(self.f, *self.args)).start()

    def stop_workers(self):
        self.q.join()
        for _ in range(N_THREADS):
            self.q.put(None)
