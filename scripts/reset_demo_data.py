import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database import engine, Base
from app.seed import seed_database

if __name__ == "__main__":
    print("[*] Resetting and re-seeding database...")
    Base.metadata.drop_all(bind=engine)
    seed_database()
    print("[+] Database reset completed!")
