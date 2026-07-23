# ClearPath Step 4: auth contract alignment

This pack reconciles the backend and frontend session contracts. The old backend expected a refresh token in the request body while the new frontend called refresh with a cookie, and login leaked the refresh token in JSON. These replacements use an httpOnly refresh cookie, rotate it server-side, and serialize only the access-token response.

Before merge: ensure `cookie-parser` is registered, replace the `missing-token` shortcut with a direct UnauthorizedException, update cookie path if the proxy exposes a different auth prefix, and add supertest coverage for login, refresh rotation, logout, and reuse detection.
