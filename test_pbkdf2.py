from passlib.context import CryptContext

print("Initializing CryptContext with pbkdf2_sha256...")
try:
    pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
    print("CryptContext initialized.")
except Exception as e:
    print(f"Failed to init CryptContext: {e}")
    exit(1)

password = "securepassword123"
hashed = pwd_context.hash(password)
print(f"Hashed: {hashed}")
verified = pwd_context.verify(password, hashed)
print(f"Verified: {verified}")
