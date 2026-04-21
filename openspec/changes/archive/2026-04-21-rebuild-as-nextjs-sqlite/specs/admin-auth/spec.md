## ADDED Requirements

### Requirement: Admin credentials configured via environment variables
The system SHALL derive the single admin identity from environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH`. The password hash SHALL be an argon2id hash. The raw password SHALL NOT appear in source code, in any client-side bundle, or in logs.

#### Scenario: Required env vars are missing at startup
- **WHEN** the server starts without `ADMIN_USERNAME` or `ADMIN_PASSWORD_HASH` set
- **THEN** the process SHALL fail fast with a clear error message identifying the missing variable
- **AND** the login endpoint SHALL NOT be reachable in a degraded fallback mode

#### Scenario: Password hash is inspected from the client
- **WHEN** any visitor downloads the public JavaScript bundle
- **THEN** neither the admin username nor the password hash SHALL appear in that bundle

### Requirement: Login endpoint verifies credentials server-side
The system SHALL expose `POST /api/auth/login` which accepts `{username, password}`, verifies them server-side against the configured username and argon2id hash, and on success sets an `iron-session` cookie. The cookie SHALL be `httpOnly`, `secure` (in production), `sameSite=lax`, and signed/encrypted with `SESSION_SECRET`.

#### Scenario: Correct credentials
- **WHEN** a client posts the correct username and password to `/api/auth/login`
- **THEN** the response SHALL be 200 with a `Set-Cookie` header establishing an authenticated session
- **AND** subsequent requests carrying that cookie SHALL be treated as authenticated

#### Scenario: Incorrect credentials
- **WHEN** a client posts an incorrect username or password
- **THEN** the response SHALL be 401
- **AND** no session cookie SHALL be set
- **AND** the error message SHALL NOT reveal whether the username or the password was the incorrect field

#### Scenario: Malformed request body
- **WHEN** the request body is missing `username` or `password`, or is not valid JSON
- **THEN** the response SHALL be 400
- **AND** no session cookie SHALL be set

### Requirement: Logout endpoint clears the session
The system SHALL expose `POST /api/auth/logout` which clears the session cookie regardless of prior state.

#### Scenario: Authenticated user logs out
- **WHEN** an authenticated client posts to `/api/auth/logout`
- **THEN** the response SHALL include a `Set-Cookie` header that expires the session cookie
- **AND** subsequent requests using the old cookie SHALL be treated as unauthenticated

#### Scenario: Unauthenticated request to logout
- **WHEN** a client with no session cookie posts to `/api/auth/logout`
- **THEN** the response SHALL be 200 (idempotent)

### Requirement: Middleware protects admin routes and admin API
Next.js middleware SHALL check for a valid session cookie on every request to `/admin/*` and `/api/admin/*`. Unauthenticated requests to `/admin/*` SHALL be redirected to `/admin/login`. Unauthenticated requests to `/api/admin/*` SHALL receive a 401 JSON response.

#### Scenario: Unauthenticated visitor opens an admin page
- **WHEN** a visitor without a session cookie requests `/admin` or any path under `/admin/`
- **THEN** the response SHALL be a redirect to `/admin/login`
- **AND** the original destination SHALL be preserved so login can return to it

#### Scenario: Unauthenticated mutation attempt
- **WHEN** a client without a session cookie sends any request to a path under `/api/admin/`
- **THEN** the response SHALL be 401 with a JSON error body
- **AND** the backing handler SHALL NOT execute any database mutation

#### Scenario: Authenticated request
- **WHEN** a client with a valid session cookie requests `/admin` or `/api/admin/*`
- **THEN** the middleware SHALL pass the request through to the route handler

### Requirement: Session cookie cannot be forged or bypassed client-side
The session SHALL be established only by the server after a successful credential check. Manipulating client-side storage (including `localStorage`, `sessionStorage`, or unsigned cookies) SHALL NOT grant admin access.

#### Scenario: Attacker sets a plausible cookie manually
- **WHEN** a client sets a cookie whose value is not a valid `iron-session` payload signed by `SESSION_SECRET`
- **THEN** middleware SHALL treat the request as unauthenticated

#### Scenario: Session cookie from a prior `SESSION_SECRET`
- **WHEN** `SESSION_SECRET` is rotated and a client presents a cookie signed by the previous secret
- **THEN** middleware SHALL treat the request as unauthenticated
