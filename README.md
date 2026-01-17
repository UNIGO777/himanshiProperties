# Himanshi Properties Backend API (User Panel)

Base URL (local):

```text
http://localhost:5050
```

All endpoints below are for the user-facing panel (non-admin).

Health check:
- `GET /` → `{ "status": "ok" }`

Uploads static:
- Uploaded files are served from `GET /uploads/...`

## Auth

JWT:
- Returned by OTP verification endpoints
- Send as `Authorization: Bearer <token>`
- Token payload includes `role`, `userId`, `email`
- Token expiry: 6 hours

OTP:
- OTP validity: 5 minutes
- OTP is sent to the user email

### POST /api/auth/signup

Creates/updates an unverified user and sends OTP to email.

Headers:
- `Content-Type: application/json`

Body:

```json
{
  "name": "User Name",
  "phone": "+919999999999",
  "email": "user@example.com",
  "password": "your-password"
}
```

Success (200):

```json
{ "message": "OTP sent for signup" }
```

Common errors:
- 400 `{ "message": "Name, phone, email and password required" }`
- 409 `{ "message": "User already exists" }`

### POST /api/auth/signup/verify-otp

Verifies signup OTP and returns JWT.

Headers:
- `Content-Type: application/json`

Body:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Success (200):

```json
{ "token": "<jwt>" }
```

Common errors:
- 400 `{ "message": "Email and OTP required" }`
- 400 `{ "message": "Invalid or expired OTP" }`
- 404 `{ "message": "User not found" }`

### POST /api/auth/login

Validates password, then sends OTP to email for login.

Headers:
- `Content-Type: application/json`

Body:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

Success (200):

```json
{ "message": "OTP sent for login" }
```

Common errors:
- 400 `{ "message": "Email and password required" }`
- 401 `{ "message": "Invalid credentials" }`
- 403 `{ "message": "User not verified" }`
- 403 `{ "message": "User blocked" }`

### POST /api/auth/login/verify-otp

Verifies login OTP and returns JWT.

Headers:
- `Content-Type: application/json`

Body:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Success (200):

```json
{ "token": "<jwt>" }
```

Common errors:
- 400 `{ "message": "Email and OTP required" }`
- 400 `{ "message": "Invalid or expired OTP" }`
- 403 `{ "message": "User not verified" }`
- 403 `{ "message": "User blocked" }`
- 404 `{ "message": "User not found" }`

## Properties

### GET /api/properties

Lists all properties (latest first).

Headers:
- `Accept: application/json`

Success (200):
- Returns an array of Property documents.

### GET /api/properties/:id

Gets a single property.

Path params:
- `id`: Property MongoDB ObjectId

Headers:
- `Accept: application/json`

Success (200):
- Returns a Property document.

Common errors:
- 400 `Invalid property id`
- 404 `{ "message": "Property not found" }`

### GET /api/properties/search

Search + filters + pagination.

Headers:
- `Accept: application/json`

Query params (all optional):
- `q`: text search (title/description/address/city/state/pincode/ownerName)
- `city`, `state`, `pincode`
- `propertyType`, `listingType`, `status`, `furnishedStatus`, `listedBy`, `facing`
- `verified`: `true|false`
- `isFeatured`: `true|false`
- `minPrice`, `maxPrice`
- `minArea`, `maxArea`
- `minBedrooms`, `minBathrooms`
- `amenities`: comma-separated list, e.g. `amenities=Parking,Lift`
- `page` (default 1)
- `limit` (default 20, max 100)
- `sortBy`: `createdAt|price|area|views` (default `createdAt`)
- `sortOrder`: `asc|desc` (default `desc`)

Success (200):

```json
{
  "items": [],
  "meta": { "total": 0, "page": 1, "pages": 1, "limit": 20 }
}
```

## Property Queries

### POST /api/properties/:propertyId/queries

Creates a query/enquiry for a property (user only).

Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

Path params:
- `propertyId`: Property MongoDB ObjectId

Body:

```json
{
  "message": "I am interested in this property. Please call me.",
  "name": "Optional override name",
  "email": "optional-override@example.com",
  "phone": "+919999999999"
}
```

Notes:
- `message` is required
- `name/email/phone` are optional; if not provided, user profile values are used

Success (201):
- Returns the created PropertyQuery document.

Common errors:
- 401 `{ "message": "Unauthorized" }`
- 403 `{ "message": "Forbidden" }` (when token role is not `user`)
- 404 `{ "message": "Property not found" }`

### GET /api/properties/:propertyId/queries

Lists queries for a property.

Headers:
- `Authorization: Bearer <token>`

Behavior:
- User token: returns only that user's queries for the property
- Admin token: returns all queries for that property (admin panel use)

Success (200):
- Returns an array of PropertyQuery documents.

## Property Ratings

### POST /api/properties/:propertyId/ratings

Creates or updates the user's rating for a property (user only).

Headers:
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

Path params:
- `propertyId`: Property MongoDB ObjectId

Body:

```json
{
  "stars": 5,
  "comment": "Optional comment"
}
```

Rules:
- `stars` is required and must be between 1 and 5
- If the user already rated this property, the rating is updated (200). Otherwise created (201).

Success (200 or 201):
- Returns the Rating document.

Common errors:
- 401 `{ "message": "Unauthorized" }`
- 403 `{ "message": "Forbidden" }` (when token role is not `user`)
- 404 `{ "message": "Property not found" }`

## Uploads

These endpoints upload files and return public URLs.

Headers:
- `Content-Type: multipart/form-data`

### POST /api/upload/image

Uploads a single image.

Form-data:
- `file`: image file

Limits:
- Only `image/*`
- Max 10 MB

Success (200):

```json
{
  "url": "http://localhost:5050/uploads/images/<filename>",
  "filename": "<filename>",
  "mimetype": "image/jpeg",
  "size": 12345
}
```

### POST /api/upload/images

Uploads multiple images.

Form-data:
- `files`: up to 10 image files

Limits:
- Only `image/*`
- Max 10 MB per file

Success (200):

```json
{
  "files": [
    {
      "url": "http://localhost:5050/uploads/images/<filename>",
      "filename": "<filename>",
      "mimetype": "image/jpeg",
      "size": 12345
    }
  ]
}
```

### POST /api/upload/video

Uploads a single video.

Form-data:
- `file`: video file

Limits:
- Only `video/*`
- Max 200 MB

Success (200):

```json
{
  "url": "http://localhost:5050/uploads/videos/<filename>",
  "filename": "<filename>",
  "mimetype": "video/mp4",
  "size": 12345
}
```

## Postman Quick Test

Environment variables:
- `baseUrl`: `http://localhost:5050`
- `token`: paste JWT received from `/api/auth/*/verify-otp`

Example (Property search):
- Method: `GET`
- URL: `{{baseUrl}}/api/properties/search?city=Delhi&page=1&limit=10`

Example (Create query):
- Method: `POST`
- URL: `{{baseUrl}}/api/properties/<propertyId>/queries`
- Headers:
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- Body (raw JSON):

```json
{ "message": "Please share more details." }
```

Example (Upload image):
- Method: `POST`
- URL: `{{baseUrl}}/api/upload/image`
- Body: `form-data`
  - Key: `file` (type: File)
