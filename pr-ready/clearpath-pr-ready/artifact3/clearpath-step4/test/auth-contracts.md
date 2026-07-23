# Step 4 auth contract checks

- Login sets `clearpath_refresh` as an httpOnly cookie and never returns the raw refresh token in JSON.
- Refresh reads only the cookie, rotates it, and returns a new access token.
- Logout revokes server sessions and clears the cookie.
- Frontend sends `credentials: include` for every request.
- Concurrent 401 responses share one refresh request instead of rotating the same token twice.
- A missing refresh cookie returns an authentication failure, not a successful empty response.
- `sameSite`, `secure`, and cookie path are reviewed again when the public API origin is finalized.
