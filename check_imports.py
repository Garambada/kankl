import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

try:
    print("Importing backend.api.auth...")
    from backend.api import auth
    print("Success.")

    print("Importing backend.api.users...")
    from backend.api import users
    print("Success.")

    print("Importing backend.api.bookings...")
    from backend.api import bookings
    print("Success.")

    print("All imports successful.")
except Exception as e:
    print(f"Import failed: {e}")
    # Print traceback
    import traceback
    traceback.print_exc()
