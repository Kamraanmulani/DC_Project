"""
Lamport Logical Clock Implementation
Based on Leslie Lamport's 1978 paper: "Time, Clocks, and the Ordering of Events in a Distributed System"
Used for Experiment 3 in Distributed Computing Lab.
"""

class LamportClock:
    def __init__(self, initial_time=0):
        self.time = initial_time

    def increment(self):
        """Internal event: advance clock by 1"""
        self.time += 1
        return self.time

    def send_event(self):
        """Send event: advance clock by 1 before sending message"""
        self.time += 1
        return self.time

    def receive_event(self, received):
        """
        Receive event: update clock according to Lamport's algorithm:
        L(e) = max(L_local, L_received) + 1
        """
        self.time = max(self.time, int(received)) + 1
        return self.time

    def get_time(self):
        return self.time

    def __str__(self):
        return str(self.time)
