# # test ORM models of the project
#
# import os
# import django
#
# # setup simulated env
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clipping.settings')
# django.setup(set_prefix=False)


# test code

import MySQLdb
import os

try:
    conn = MySQLdb.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        passwd=os.getenv('DB_PASSWORD', 'minyic'),
        db=os.getenv('DB_NAME', 'clipping_test')
    )
    print("Connection successful!")
    conn.close()
except MySQLdb.OperationalError as e:
    print(f"Connection failed: {e}")
