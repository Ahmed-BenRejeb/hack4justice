"""Password hashing with the standard library's scrypt (A3).

The stored string carries its own cost parameters and salt, so raising the
cost later leaves existing hashes verifiable.
"""

import hashlib
import hmac
import secrets

# OWASP's minimum scrypt cost: N=2^17, r=8, p=1 (about 128 MiB per hash).
SCRYPT_N = 2**17
SCRYPT_R = 8
SCRYPT_P = 1
SALT_BYTES = 16


def _scrypt(password: str, salt: bytes, n: int, r: int, p: int, dklen: int) -> bytes:
    # hashlib refuses above 32 MiB by default; scrypt needs 128 * n * r bytes, doubled for margin.
    return hashlib.scrypt(
        password.encode(), salt=salt, n=n, r=r, p=p, maxmem=256 * n * r, dklen=dklen
    )


def hash_password(password: str) -> str:
    """A salted scrypt hash of `password`, as `scrypt$n$r$p$salt$digest`."""
    salt = secrets.token_bytes(SALT_BYTES)
    digest = _scrypt(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P, dklen=64)
    return f"scrypt${SCRYPT_N}${SCRYPT_R}${SCRYPT_P}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """Whether `password` matches a hash made by `hash_password`, compared in constant time."""
    _, n, r, p, salt, expected = stored.split("$")
    digest = _scrypt(
        password, bytes.fromhex(salt), int(n), int(r), int(p), dklen=len(expected) // 2
    )
    return hmac.compare_digest(digest.hex(), expected)
