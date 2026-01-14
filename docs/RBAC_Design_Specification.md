# RBAC Authentication & Authorization Design Specification

This document details the standard implementation of Role-Based Access Control (RBAC) and Multi-tenancy (Schema-per-tenant) in the Duanruo Exam System. It serves as the authoritative guide for the authentication and authorization flows.

## 1. Core Architecture Overview

The system uses a **Stateless JWT (JSON Web Token)** architecture with **Schema-per-tenant** data isolation.

* **Frontend (Next.js):** Handles user interaction, stores tokens, and handles 401/403 responses.
* **Backend (Spring Boot 3):** Handles authentication, token generation, and enforces permission checks.
* **Database (PostgreSQL):** Uses a shared `public` schema for global data (Users, Tenants) and separate schemas (e.g., `tenant_acme`) for tenant-specific data.

---

## 2. Phase 1: Authentication (The Login Flow)

This phase covers how a user obtains a "Digital Passport" (JWT).

### 2.1. Frontend Submission

* **Action:** User enters credentials on the login page.
* **Request:** `POST /api/v1/auth/login`
* **Payload:** `{ "username": "...", "password": "..." }`

### 2.2. Identity Verification (Spring Boot)

* **Component:** `AuthController` -> `AuthenticationService` -> `AuthenticationManager`.
* **Process:**
    1. Validates username and password against the `users` table in the `public` schema.
    2. Loads user details, including Global Roles (e.g., `SUPER_ADMIN`).

### 2.3. JWT Generation (Token Creation)

* **Component:** `JwtTokenService`
* **Key Logic:**
  * If the user logs in directly (Global Context), a **Global Token** is generated.
  * If the user selects a tenant (Tenant Context), a **Tenant Token** is generated.
* **Claims (Payload):**
  * `sub`: Username
  * `userId`: User UUID
  * `roles`: List of roles (e.g., `["TENANT_ADMIN", "EXAM_VIEW"]`)
  * `tenantId`: **CRITICAL**. The UUID of the active tenant (only for Tenant Tokens).
  * `tokenType`: `"GLOBAL"` or `"TENANT"`

**Example Decoded Payload:**

```json
{
  "sub": "admin_acme",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "roles": ["TENANT_ADMIN"],
  "tenantId": "421eee4a-1a2a-4f9d-95a4-37073d4b15c5",
  "tokenType": "TENANT",
  "exp": 1711234567
}
```

### 2.4. Frontend Storage

* **Action:** Next.js receives the JWT.
* **Storage:** Stored in `localStorage` or `HttpOnly Cookie` (preferred for security).

---

## 3. Phase 2: Authorization (The Request Flow)

This phase covers how a user accesses protected resources.

### 3.1. Carrying the Token

* **Action:** Frontend attaches the token to every API request.
* **Header:** `Authorization: Bearer <JWT_STRING>`
* **Optional Header:** `X-Tenant-ID` (Explicitly requested tenant context).

### 3.2. The Filter Chain (The Gatekeepers)

Requests pass through a chain of filters in `SecurityConfig`.

#### Step A: Tenant Context Filter (`TenantContextFilter`)

* **Order:** Executes **BEFORE** authentication (Order 1).
* **Responsibility:** Determine the "Requested Tenant".
* **Logic:**
    1. Checks `X-Tenant-ID` header.
    2. Checks URL path (e.g., `/api/v1/{tenantId}/...`).
    3. Sets the ID in `TenantContext` (ThreadLocal).
    4. **Crucial:** If no tenant is found, it may default to `public` or remain empty.

#### Step B: JWT Authentication Filter (`JwtAuthenticationFilter`)

* **Responsibility:** Validate Identity & Enforce Context Consistency.
* **Logic:**
    1. **Extract & Validate:** Parses the JWT and verifies the signature.
    2. **Extract Claims:** Gets `username`, `roles`, and `tenantId` from the token.
    3. **Context Consistency Check:**
        * **Case 1:** If `TenantContext` is already set (via Header/URL), verify it matches the `tenantId` in the Token. **Mismatch = 403 Forbidden.**
        * **Case 2:** If `TenantContext` is empty, **Restore** it using the `tenantId` from the Token.
    4. **Build Authentication:**
        * Creates `UsernamePasswordAuthenticationToken`.
        * Sets `authorities` (Roles/Permissions).
        * Populates `SecurityContextHolder`.

### 3.3. Access Decision (Controller Level)

* **Mechanism:** Spring Security `@PreAuthorize`.
* **Usage:**

    ```java
    @PreAuthorize("hasAuthority('TENANT_CREATE')")
    @PostMapping("/tenants")
    public ResponseEntity<TenantResponse> createTenant(...)
    ```

* **Outcome:**
  * **Allow:** If `SecurityContext` contains the required authority.
  * **Deny:** Throws `AccessDeniedException` -> 403 Response.

---

## 4. Multi-tenancy & Data Isolation

This is the core "Schema-per-tenant" implementation.

### 4.1. The Context Holder (`TenantContext`)

* **Implementation:** `ThreadLocal<TenantId>`
* **Purpose:** Holds the active tenant ID for the current thread/request. Accessible anywhere in the code.

### 4.2. The Resolver (`TenantIdentifierResolver`)

* **Interface:** Hibernate `CurrentTenantIdentifierResolver`
* **Logic:** Reads the ID from `TenantContext`. If empty, returns `"public"`.

### 4.3. The Connection Provider (`TenantSchemaConnectionProvider`)

* **Interface:** Hibernate `MultiTenantConnectionProvider`
* **Logic:**
    1. Intercepts the database connection request.
    2. Gets the `tenantIdentifier` from the Resolver.
    3. **Schema Switching:**

        ```sql
        SET search_path TO tenant_xyz, public;
        ```

    4. **Result:** All subsequent SQL queries in this transaction automatically run against the `tenant_xyz` schema.

---

## 5. Database Design (Unified RBAC)

### 5.1. Global Schema (`public`)

Contains shared data and identity information.

* `users`: Global user accounts (username, password, email).
* `tenants`: Tenant registry (id, code, schema_name).
* `roles`: Global role definitions.
* `user_tenant_roles`: **The Bridge**. Maps Users to Tenants with specific Roles.
  * `user_id`
  * `tenant_id`
  * `role_id`

### 5.2. Tenant Schemas (`tenant_{code}`)

Contains isolated business data.

* `exams`
* `applications`
* `questions`
* *Note: No user tables here. Users are global.*

---

## 6. Summary of Key Classes

| Component | Class Name | Responsibility |
| :--- | :--- | :--- |
| **Token Gen** | `JwtTokenService` | Generates JWTs with `tenantId` claim. |
| **Auth Filter** | `JwtAuthenticationFilter` | Parses JWT, sets `SecurityContext`, validates Tenant match. |
| **Tenant Filter** | `TenantContextFilter` | Extracts Tenant ID from Header/URL, sets `TenantContext`. |
| **Context** | `TenantContext` | ThreadLocal storage for Tenant ID. |
| **DB Resolver** | `TenantIdentifierResolver` | Bridges `TenantContext` to Hibernate. |
| **DB Provider** | `TenantSchemaConnectionProvider` | Executes `SET search_path` for isolation. |
