import sys
import os

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.seed import seed_database

if __name__ == "__main__":
    print("[*] Running RaktaReach demo database seeder...")
    seed_database()
    print("[+] Seeding completed successfully!")
