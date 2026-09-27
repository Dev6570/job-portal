"""
NOTE: these were NOT executed in the sandbox this module was built in (no
network access there to install passlib / pydantic-settings, both of which
app.auth.utils imports at module level). The identical encode/decode/expiry/
type-check logic WAS verified standalone with the real PyJWT library before
this file was written - see the PR/handoff notes. Run this for real the
first time you touch app/auth/utils.py locally.
"""
import uuid
from datetime import timedelta

import pytest

from app.auth.utils import (
    InvalidTokenError,
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def test_access_token_round_trip():
    user_id = uuid.uuid4()
    token = create_access_token(user_id, "admin")
    claims = decode_token(token, TokenType.access)
    assert claims["sub"] == str(user_id)
    assert claims["role"] == "admin"


def test_refresh_token_round_trip():
    user_id = uuid.uuid4()
    token = create_refresh_token(user_id, "student")
    claims = decode_token(token, TokenType.refresh)
    assert claims["role"] == "student"


def test_wrong_type_is_rejected():
    user_id = uuid.uuid4()
    access = create_access_token(user_id, "admin")
    with pytest.raises(InvalidTokenError):
        decode_token(access, TokenType.refresh)


def test_tampered_token_is_rejected():
    user_id = uuid.uuid4()
    token = create_access_token(user_id, "admin")
    with pytest.raises(InvalidTokenError):
        decode_token(token + "x", TokenType.access)
