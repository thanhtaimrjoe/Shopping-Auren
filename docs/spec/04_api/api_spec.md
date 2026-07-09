# API Specification — Shopping Memo

**Date Created**: 2026-05-09  
**Last Updated**: 2026-05-24 (AI Assistant - English Translation & QA Fixes applied)  
**Project**: Shopping Memo  
**Purpose**: Definition of REST API specifications

---

## Overview

### Base URL
- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://shopping-memo.vercel.app/api/v1`

### Authentication
- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Provider**: Supabase Auth

### Response Format
- **Content-Type**: `application/json`
- **Encoding**: UTF-8

---

## Common Specifications

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

### HTTP Status Codes
| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Success (GET, PUT, PATCH) |
| 201 | Created | Resource successfully created (POST) |
| 204 | No Content | Deletion successful (DELETE) |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication failed (Missing/Invalid JWT) |
| 403 | Forbidden | Insufficient permissions (IDOR protection - User does not own the resource) |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource conflict (e.g., duplicate meal name) |
| 422 | Unprocessable Entity | Validation error (e.g., body format) |
| 500 | Internal Server Error | Server error |

---

## 1. Authentication API

### 1.1 Register User
**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "Tai HT"
}
```

**QA/Security Rules**:
- Implement rate limiting to prevent spam.
- Password requires minimum 8 chars, 1 uppercase, 1 number, 1 special character.

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "display_name": "Tai HT",
      "created_at": "2026-05-09T16:56:31.003Z"
    }
  },
  "message": "Registration successful. Please check your email for verification."
}
```

---

### 1.2 Login
**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**QA/Security Rules**:
- Implement brute-force protection (lockout after N failed attempts).
- Return generic error messages ("Invalid email or password") to prevent email enumeration.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_in": 3600,
    "user": { ... }
  }
}
```

---

## 2. Meals API

*All endpoints require `Authorization: Bearer <token>`*

### 2.1 Get Meal List
**Endpoint**: `GET /meals`

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| limit | integer | No | 20 | Pagination limit |
| offset | integer | No | 0 | Pagination offset |
| category | string | No | - | Filter by category |
| q | string | No | - | Partial search by meal name (Case-insensitive) |
| sort | string | No | created_at | Sort criteria |

**Security Note**: Backend MUST append `WHERE deleted_at IS NULL AND user_id = <JWT_USER_ID>` to the query.

**Response** (200):
```json
{
  "success": true,
  "data": {
    "total_count": 1,
    "meals": [
      {
        "id": "uuid",
        "name": "Curry Rice",
        "ingredients": ["Potato", "Carrot", "Onion", "Pork", "Curry Roux"],
        "category": "washoku",
        "created_at": "2026-05-09T16:56:31.003Z",
        "updated_at": "2026-05-09T16:56:31.003Z"
      }
    ]
  }
}
```

---

### 2.2 Create Meal
**Endpoint**: `POST /meals`

**Request Body**:
```json
{
  "name": "Curry Rice",
  "ingredients": ["Potato", "Carrot", "Onion", "Pork", "Curry Roux"],
  "category": "washoku"
}
```

**Validation**:
- `name`: Required, max 100 chars, trimmed.
- `ingredients`: JSONB array of strings (max 50 items).
- `user_id` MUST be extracted from the JWT token. Do not accept it in the body.

**Response** (201 Created)

---

### 2.3 Update Meal
**Endpoint**: `PATCH /meals/{meal_id}`

**Request Body**:
*(Only include fields to update)*
```json
{
  "name": "Spicy Curry Rice"
}
```

**Security Note**: Verify ownership (`WHERE id = meal_id AND user_id = JWT_USER_ID`). Return 403 if mismatch.

**Response** (200 OK)

---

### 2.4 Delete Meal
**Endpoint**: `DELETE /meals/{meal_id}`

**QA Rule**: **Soft Delete Only**. Set `deleted_at = now()`.
If the meal is currently linked to an active `meal_plan`, the backend must reject the request with `409 Conflict`.

**Response** (204 No Content)

---

## 3. Storage & Products API

*All endpoints require `Authorization: Bearer <token>`*

### 3.1 Upload Image
**Endpoint**: `POST /storage/upload`

**Description**: Uploads a physical file (e.g., product image) to Supabase Storage bucket `product-images` under the user's specific folder. Must be called before `POST /products` if an image is provided.

**Request**: `multipart/form-data` containing the file.

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "image_url": "https://<supabase-url>/storage/v1/object/public/product-images/user_uuid/timestamp-filename.jpg"
  }
}
```

---

### 3.2 Get Product List
**Endpoint**: `GET /products`
*(Follows the same Pagination and Search query parameters as `GET /meals`)*

---

### 3.3 Create Product
**Endpoint**: `POST /products`

**Request Body**:
```json
{
  "name": "Toilet Paper",
  "image_url": "https://...",
  "category": "daily"
}
```
*Note: `image_url` must be a valid HTTP/HTTPS URL.*

---

### 3.4 Update Product
**Endpoint**: `PATCH /products/{product_id}`
*Verifies ownership via JWT. Returns 403 if unauthorized.*

---

### 3.5 Delete Product
**Endpoint**: `DELETE /products/{product_id}`

**QA Rule**: **Soft Delete Only**. Set `deleted_at = now()`.
**Storage Cleanup**: The backend should asynchronously trigger a deletion of the physical file located at `image_url` from the Cloud Storage to prevent storage bloat.

---

## 4. Meal Plan API

### 4.1 Get Current Meal Plan
**Endpoint**: `GET /meal-plans/current`

**Description**: Fetches the user's latest meal plan. Timezone handling must be localized. Soft-deleted meals must not be returned in the sub-query.

---

### 4.2 Create/Update Meal Plan
**Endpoint**: `POST /meal-plans` or `PUT /meal-plans/{plan_id}`

**Request Body**:
```json
{
  "meals": [
    { "day_of_week": 0, "meal_id": "uuid" },
    { "day_of_week": 1, "meal_id": "uuid" }
  ]
}
```

**Technical Requirement**: Must use a **Database Transaction**. Either all 7 days save successfully, or the entire operation rolls back.

---

## 5. Shopping List API

### 5.1 Generate Draft
**Endpoint**: `POST /shopping-lists/generate`

**Description**: Generates a draft shopping list from the current active Meal Plan.

**Technical Requirement**: The operation to delete the old active list and create the new one from the draft MUST be wrapped in a **Single Database Transaction** to prevent data corruption.

---

### 5.2 Check/Uncheck Item
**Endpoint**: `PATCH /shopping-lists/{list_id}/items/{item_id}`

**Request Body**:
```json
{
  "checked": true
}
```

**UX Requirement**: Frontend must implement **Optimistic Updates** (UI updates immediately before API responds). Backend API must be fast to support this.

---

### 5.3 Complete Shopping List
**Endpoint**: `POST /shopping-lists/{list_id}/complete`

**Description**: Marks the list as completed, populates `snapshot_json` with current items for history, and sets `completed_at`.

---

**Author**: AI Assistant + Tai  
**Status**: ✅ Active (Synced with Epic 1-6 English Requirements & DB Schema)