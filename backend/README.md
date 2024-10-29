set PYTHONPATH=%PYTHONPATH%;C:\Users\User\Projects\clipping\backend\clipping

temporarily set python path, maybe include in this in conda shell when init conda?


MariaDB [(none)]> GRANT ALL PRIVILEGES ON clipping_test.* TO 'root'@'localhost';
Query OK, 0 rows affected (0.001 sec)

MariaDB [(none)]> FLUSH PRIVILEGES;
Query OK, 0 rows affected (0.000 sec)

# you should also run the project at the root folder, that is clipping via python mamage.py [cmd]

# manual fix for module not found issue
```python
# in manage.py
# Determine the parent of the parent directory of the current file
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Append the parent of the parent directory to sys.path
sys.path.append(project_root)
```