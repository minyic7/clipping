import unittest
from src import create_app
from src.applications.clipping import db
import functools


# Utility decorator for printing test start and end
def test_message(func):
    @functools.wraps(func)
    def wrapper(self, *args, **kwargs):
        print(f"Starting test: {func.__name__}...")
        result = func(self, *args, **kwargs)
        print(f"Finished test: {func.__name__}")
        return result

    return wrapper


class AppTestCase(unittest.TestCase):

    def setUp(self):
        # Initialize the app with a test configuration
        self.app = create_app()
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'  # In-memory database for testing
        self.app.config['TESTING'] = True

        with self.app.app_context():
            # Create all tables in the in-memory database
            db.create_all()

        self.client = self.app.test_client()
        self.app.testing = True

    def tearDown(self):
        # Clean up the in-memory database after each test
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    @test_message
    def test_home(self):
        result = self.client.get('/')
        self.assertEqual(result.status_code, 200)
        self.assertIn(b"Welcome to the Clipping Backend", result.data)

    @test_message
    def test_list_all_tables(self):
        with self.app.app_context():
            # Get the list of all tables
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()

            print("Tables in the database:", tables)

            # You can add an assertion to ensure certain tables exist
            self.assertIn('user', tables)  # Replace 'user' with expected table name(s)


if __name__ == '__main__':
    unittest.main()
