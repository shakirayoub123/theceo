# PostgreSQL setup

Django is configured to connect to the separate `ceoinfluencers_db` database as `ceoinfluencers_user` on `127.0.0.1:5432`. The password is deliberately not stored in source control or included in this guide. Django requires it through `DB_PASSWORD`.

## 1. Check the server first

On the PostgreSQL server, inspect whether the requested resources already exist:

```sh
sudo -u postgres psql -d postgres -c "SELECT datname FROM pg_database WHERE datname IN ('ceoinfluencers_db', 'tci_db');"
sudo -u postgres psql -d postgres -c "SELECT rolname FROM pg_roles WHERE rolname IN ('ceoinfluencers_user', 'tci_db_user');"
```

This only reads catalog information. It should show `tci_db` and `tci_db_user` unchanged if they exist.

## 2. Create only missing resources

Run a creation command only when its resource was absent from the checks above. These commands do not alter the existing `tci_db` database or `tci_db_user` role.

If the new role is absent, create it and enter a newly generated, unique password when prompted:

```sh
sudo -u postgres createuser --login --pwprompt ceoinfluencers_user
```

If the new database is absent, create it owned by the requested role:

```sh
sudo -u postgres createdb --owner=ceoinfluencers_user ceoinfluencers_db
```

If one target resource already exists, do not recreate or alter it. If the database exists but the role does not, pause and review ownership/permissions rather than changing the existing database automatically.

## 3. Set the application environment

The local ignored file `backend/.env` has the database name, user, host, and port configured. Add the actual `DB_PASSWORD` there only if you are connecting to a PostgreSQL instance on your development machine. Keep this file private; it is ignored by Git.

On the server, set these values in the backend process's private environment or its server-side `backend/.env`:

```dotenv
DB_ENGINE=django.db.backends.postgresql
DB_NAME=ceoinfluencers_db
DB_USER=ceoinfluencers_user
DB_HOST=127.0.0.1
DB_PORT=5432
DB_PASSWORD=<the newly generated role password>
```

Store the password in a server-side secret manager or a file readable only by the application account. Do not commit it, put it in deployment scripts, or reuse a password that has been posted in chat. `127.0.0.1` works only when Django and PostgreSQL are on the same server; otherwise use the database host provided by your provider and configure permitted remote access.

## 4. Install and migrate

The backend requirements already include the PostgreSQL driver (`psycopg2-binary`). Install backend dependencies if needed, then from `backend/` run:

```sh
python manage.py check
python manage.py migrate
```

`migrate` creates Django's schema in the configured new database. It does not copy records from the existing SQLite file or `tci_db`; plan a separate, backed-up data migration if existing records need to be retained.
