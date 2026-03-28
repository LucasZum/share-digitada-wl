"""
AES-256-GCM encryption/decryption for Stripe secret keys.
Format stored: <nonce_b64>:<ciphertext_b64>
Key source: ENCRYPTION_KEY env var (64 hex chars = 32 bytes)
"""
import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.conf import settings


def _get_key() -> bytes:
    hex_key = settings.ENCRYPTION_KEY
    return bytes.fromhex(hex_key)


def encrypt(plaintext: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
    nonce_b64 = base64.b64encode(nonce).decode('ascii')
    ct_b64 = base64.b64encode(ciphertext).decode('ascii')
    return f"{nonce_b64}:{ct_b64}"


def decrypt(token: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce_b64, ct_b64 = token.split(':', 1)
    nonce = base64.b64decode(nonce_b64)
    ciphertext = base64.b64decode(ct_b64)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode('utf-8')
