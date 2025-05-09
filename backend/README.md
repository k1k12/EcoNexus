# Backend Set Up
## 1. Setting Up the Backend Locally
### Create venv
- Make sure you've created an isolated virtual environment for python, or so called "venv".
`python3 -m venv venv`
- If not please do so, and if you face any difficulties, use Google or ChatGPT. 
- On windows there are multiple ways to do that, depending on whether you're using powershell or cmd, and I don't want to describe them all here (I'll have Windows flashbacks lol, **joking, just lazy**).
- Activate (source into) the virtual environment.
`source venv/bin/activate`
- Make sure you're in the *backend directory* and run: 
`python3 -m pip install -r requirements.txt`

### Install requirements
- Updated -> now store project dependencies through pyproject.toml
- From the backend/ directory run:
`make install`

### Ensure .env is set up right
PYTHONPATH=./src
TEST_DATABASE_URL=postgresql+psycopg2://test:password@localhost:8081/test
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:8081/econexus
SECRET_KEY="C6QgMwMjh6h8OX8zz0K7Bfg8hL0bXm6cHfS-vq2cQd8u6FZ3Ae6gpmc6p-G3skw5Bdl7xl45K70pT2l8CxQ8Zw"
CORS_ORIGINS="http://localhost:8000,http://localhost:8081,http://localhost:8082,http://localhost:5087"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES= 30


### Start server
- Once requirements installed, and you are in the backend directory, run:
`make run`

### Running tests
- To run pytest run: (this runs everything under tests/)
`make test`
- To clear db tables, `make clear`
- To populate db tables with dummy test data, `make populate`

### Formatting
- There is a lib called black which auto cleans up all code under src, like whitespace, indents etc.
- Careful - this will change all files so conflicts will go crazy. I think we should do this when we have a working version, then we can keep all our backend clean etc. It is in the makefile.
- To run pytest format (don't do until v1 of backend is done):
`make format`

### DB
- If you are working on the backend dev, ensure postgres is set up (here is a tutorial https://www.w3schools.com/postgresql/postgresql_install.php on install, or use cl)
- When connecting password = password, user = postgres, port = 8081

### DB Migrations
- ANY changes to db tables must be put in a migration, otherwise the DB wont update.
- I used alembic to do this, but i had to drop all tables before generating as there was too much conflict with data already in the table and some things like times_open are stored (I changed this to JSON)
- here are some alembic commands to make life easier:

* Generate a new migration (after changing models) -> `alembic revision --autogenerate -m` "description of changes"
* Apply the latest migrations to the database -> `alembic upgrade head`
* Revert the last migration -> `alembic downgrade -1`
* Check current database version -> `alembic current`


