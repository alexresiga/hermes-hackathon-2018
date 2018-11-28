import time
from queue import Queue
from threading import Thread

N_THREADS = 4


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
        self.stop_workers()

        return self.results

    def worker_thread(self):
        while True:
            item = self.q.get()
            if item is None:
                break

            result = self.f(item, *self.args)
            print('Got result for item {}'.format(item))
            if result:
                self.results.append(result)
            self.q.task_done()

    def start_workers(self):
        for _ in range(N_THREADS):
            Thread(target=self.worker_thread).start()

    def stop_workers(self):
        self.q.join()
        for _ in range(N_THREADS):
            self.q.put(None)
