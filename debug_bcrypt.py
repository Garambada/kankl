from passlib.context import CryptContext
import traceback

print("Initializing CryptContext...")
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    print("CryptContext initialized.")
except Exception as e:
    print(f"Failed to init CryptContext: {e}")
    traceback.print_exc()
    exit(1)

password = "securepassword123"
print(f"Password: {password}, Type: {type(password)}, Len: {len(password)}")

try:
    print("Attempting hash with truncate...")
    truncated = password[:72]
    print(f"Truncated: {truncated}")
    h = pwd_context.hash(truncated)
    print(f"Hash success: {h}")
except Exception as e:
    print(f"Hash failed: {e}")
    traceback.print_exc()

print("\nChecking available schemes...")
print(pwd_context.schemes())
