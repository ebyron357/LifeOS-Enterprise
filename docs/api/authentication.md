# Authentication

## Overview

LifeOS Enterprise uses JWT-based authentication with short-lived access tokens and rotating refresh tokens.

---

## Token Architecture

```
┌──────────────┐       POST /auth/login        ┌──────────────────┐
│    Client    │  ──────────────────────────►  │   Auth Service   │
│              │                               │                  │
│              │  ◄──────────────────────────  │  access_token    │
│              │    access_token (15 min)      │  (JWT, body)     │
│              │    refresh_token (cookie)     │  refresh_token   │
└──────┬───────┘                               │  (httpOnly cookie│
       │                                       └──────────────────┘
       │  Authorization: ******
       ▼
┌──────────────┐
│   API Server │
│              │
│  Validates   │
│  JWT locally │
└──────────────┘
```

---

## Token Specifications

### Access Token (JWT)

| Property | Value |
|----------|-------|
| Algorithm | RS256 |
| Lifetime | 15 minutes |
| Claims | `sub` (userId), `bu_ids` (accessible business unit IDs), `role`, `iat`, `exp` |
| Delivery | Response body |
| Storage (client) | In-memory only (never localStorage) |

### Refresh Token

| Property | Value |
|----------|-------|
| Format | Opaque random token (32 bytes, base64url) |
| Lifetime | 30 days |
| Rotation | New token issued on every refresh; old token invalidated |
| Delivery | `httpOnly`, `Secure`, `SameSite=Strict` cookie |
| Storage (server) | Hashed in database; not stored in plaintext |

---

## Authentication Flows

### Registration Flow

```
1. POST /auth/register { email, password }
2. Server: validate email format + password strength
3. Server: check email uniqueness
4. Server: hash password (bcrypt, cost 12)
5. Server: create User record (unverified)
6. Server: send verification email with signed token
7. Response: 201 { message: "Verification email sent" }
8. User clicks verification link
9. POST /auth/verify-email { token }
10. Server: verify token; mark User as verified
11. Response: 200 { message: "Email verified" }
```

### Login Flow

```
1. POST /auth/login { email, password }
2. Server: find User by email (constant-time comparison)
3. Server: verify password against hash
4. Server: check rate limit (5 attempts / 15 min per IP)
5. Server: generate access token (JWT, RS256)
6. Server: generate refresh token; hash and store
7. Response: 200 { accessToken, expiresIn: 900, user }
             Set-Cookie: refreshToken=...; httpOnly; Secure; SameSite=Strict
```

### Token Refresh Flow

```
1. POST /auth/refresh (refresh token sent via cookie)
2. Server: read refreshToken from cookie
3. Server: verify token exists in database (check hash)
4. Server: verify token is not expired or revoked
5. Server: issue new access token
6. Server: rotate refresh token (invalidate old; store new hash)
7. Response: 200 { accessToken, expiresIn: 900, user }
             Set-Cookie: refreshToken=<new>; httpOnly; Secure
```

### Logout Flow

```
1. POST /auth/logout
2. Server: extract userId from access token
3. Server: revoke all refresh tokens for this user
4. Response: 204 No Content
             Set-Cookie: refreshToken=; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

### Password Reset Flow

```
1. POST /auth/forgot-password { email }
2. Server: always respond 200 (no email enumeration)
3. If user found: generate signed reset token; send email
4. User clicks reset link (token valid 1 hour, single-use)
5. POST /auth/reset-password { token, newPassword }
6. Server: verify token; verify new password strength
7. Server: hash new password; update User
8. Server: revoke all active sessions
9. Response: 200 { message: "Password updated" }
```

---

## Authorization Headers

All authenticated API requests must include:

```
Authorization: ******
```

Missing token → `401 TOKEN_MISSING`
Expired token → `401 TOKEN_EXPIRED`
Invalid token → `401 TOKEN_INVALID`

---

## Business Unit Access Control

Access tokens contain the list of business unit IDs the user can access. On every request:

1. API extracts `businessUnitId` from path or query parameter
2. API verifies `businessUnitId` is in the token's `bu_ids` claim
3. If not → `403 CROSS_BU_ACCESS_DENIED`

This check happens at the API gateway layer before any business logic runs.

---

## Agent Authentication

Agents authenticate as a system principal:

- Agents are issued their own tokens scoped to a specific set of MCP server tools
- Agent tokens are not user tokens — they carry `agent:{agentId}` as the subject
- Agent tokens have shorter lifetimes (scoped to a single execution run)
- Agent tokens are created and destroyed by the platform — agents never receive long-lived credentials

---

## Security Notes

- Never log access or refresh tokens — only log `userId` and `requestId`
- Refresh token rotation prevents replay attacks
- Refresh token family tracking: if a rotated (old) token is reused, all family tokens are revoked
- All authentication events are logged as domain events for audit
