import threading


class SharedBoard:
    """
    A thread-safe class for maintaining a list of history messages.
    The list has a configurable size limit to prevent overloading the backend.
    """

    def __init__(self, max_messages=100):
        """
        Initializes the SharedBoard with an empty messages list and a lock.

        :param max_messages: Maximum number of messages to retain.
        """
        self.max_messages = max_messages
        self.messages = []
        self.lock = threading.Lock()

    def post_message(self, message):
        """
        Adds a new message to the history. Removes the oldest message if the limit is exceeded.

        :param message: The message to add.
        """
        with self.lock:
            self.messages.append(message)
            # Ensure the history size does not exceed the maximum
            if len(self.messages) > self.max_messages:
                self.messages.pop(0)  # Remove the oldest message

    def fetch_latest_message(self):
        """
        Fetches the latest message from the history.

        :return: The latest message or None if the history is empty.
        """
        with self.lock:
            if self.messages:
                return self.messages[-1]
            return None
