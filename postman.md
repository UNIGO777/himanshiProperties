{
  "info": {
    "_postman_id": "6a3b6b34-9a48-4a08-9f27-2f9b0a9ad3b0",
    "name": "Himanshi Properties - User Panel APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:5050", "type": "string" },
    { "key": "token", "value": "", "type": "string" },
    { "key": "propertyId", "value": "", "type": "string" },
    { "key": "propertyId2", "value": "", "type": "string" }
  ],
  "item": [
    {
      "name": "Health",
      "item": [
        {
          "name": "GET /",
          "request": {
            "method": "GET",
            "url": { "raw": "{{baseUrl}}/", "host": ["{{baseUrl}}"], "path": [""] }
          }
        }
      ]
    },
    {
      "name": "Auth",
      "item": [
        {
          "name": "POST /api/auth/signup",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"User Name\",\n  \"phone\": \"+919999999999\",\n  \"email\": \"user@example.com\",\n  \"password\": \"your-password\"\n}\n",
              "options": { "raw": { "language": "json" } }
            },
            "url": { "raw": "{{baseUrl}}/api/auth/signup", "host": ["{{baseUrl}}"], "path": ["api", "auth", "signup"] }
          }
        },
        {
          "name": "POST /api/auth/signup/verify-otp (sets token)",
          "event": [
            {
              "listen": "test",
              "script": {
                "type": "text/javascript",
                "exec": [
                  "let data = {};",
                  "try { data = pm.response.json(); } catch (e) {}",
                  "if (data && data.token) { pm.collectionVariables.set('token', data.token); }"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"otp\": \"123456\"\n}\n",
              "options": { "raw": { "language": "json" } }
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/signup/verify-otp",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "signup", "verify-otp"]
            }
          }
        },
        {
          "name": "POST /api/auth/login",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"your-password\"\n}\n",
              "options": { "raw": { "language": "json" } }
            },
            "url": { "raw": "{{baseUrl}}/api/auth/login", "host": ["{{baseUrl}}"], "path": ["api", "auth", "login"] }
          }
        },
        {
          "name": "POST /api/auth/login/verify-otp (sets token)",
          "event": [
            {
              "listen": "test",
              "script": {
                "type": "text/javascript",
                "exec": [
                  "let data = {};",
                  "try { data = pm.response.json(); } catch (e) {}",
                  "if (data && data.token) { pm.collectionVariables.set('token', data.token); }"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"user@example.com\",\n  \"otp\": \"123456\"\n}\n",
              "options": { "raw": { "language": "json" } }
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/login/verify-otp",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "login", "verify-otp"]
            }
          }
        }
      ]
    },
    {
      "name": "Properties",
      "item": [
        {
          "name": "GET /api/properties",
          "request": {
            "method": "GET",
            "url": { "raw": "{{baseUrl}}/api/properties", "host": ["{{baseUrl}}"], "path": ["api", "properties"] }
          }
        },
        {
          "name": "GET /api/properties/:id",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/properties/{{propertyId}}",
              "host": ["{{baseUrl}}"],
              "path": ["api", "properties", "{{propertyId}}"]
            }
          }
        },
        {
          "name": "GET /api/properties/search",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/properties/search?city=Delhi&page=1&limit=10",
              "host": ["{{baseUrl}}"],
              "path": ["api", "properties", "search"],
              "query": [
                { "key": "city", "value": "Delhi" },
                { "key": "page", "value": "1" },
                { "key": "limit", "value": "10" }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Property Queries (User JWT)",
      "item": [
        {
          "name": "POST /api/properties/:propertyId/queries",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{token}}" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"message\": \"I am interested in this property. Please call me.\"\n}\n",
              "options": { "raw": { "language": "json" } }
            },
            "url": {
              "raw": "{{baseUrl}}/api/properties/{{propertyId}}/queries",
              "host": ["{{baseUrl}}"],
              "path": ["api", "properties", "{{propertyId}}", "queries"]
            }
          }
        },
        {
          "name": "GET /api/properties/:propertyId/queries",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/api/properties/{{propertyId}}/queries",
              "host": ["{{baseUrl}}"],
              "path": ["api", "properties", "{{propertyId}}", "queries"]
            }
          }
        }
      ]
    },
    {
      "name": "Property Ratings (User JWT)",
      "item": [
        {
          "name": "POST /api/properties/:propertyId/ratings",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Content-Type", "value": "application/json" },
              { "key": "Authorization", "value": "Bearer {{token}}" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"stars\": 5,\n  \"comment\": \"Optional comment\"\n}\n",
              "options": { "raw": { "language": "json" } }
            },
            "url": {
              "raw": "{{baseUrl}}/api/properties/{{propertyId}}/ratings",
              "host": ["{{baseUrl}}"],
              "path": ["api", "properties", "{{propertyId}}", "ratings"]
            }
          }
        }
      ]
    },
    {
      "name": "Uploads",
      "item": [
        {
          "name": "POST /api/upload/image",
          "request": {
            "method": "POST",
            "body": {
              "mode": "formdata",
              "formdata": [{ "key": "file", "type": "file", "src": "" }]
            },
            "url": { "raw": "{{baseUrl}}/api/upload/image", "host": ["{{baseUrl}}"], "path": ["api", "upload", "image"] }
          }
        },
        {
          "name": "POST /api/upload/images",
          "request": {
            "method": "POST",
            "body": {
              "mode": "formdata",
              "formdata": [{ "key": "files", "type": "file", "src": "" }]
            },
            "url": { "raw": "{{baseUrl}}/api/upload/images", "host": ["{{baseUrl}}"], "path": ["api", "upload", "images"] }
          }
        },
        {
          "name": "POST /api/upload/video",
          "request": {
            "method": "POST",
            "body": {
              "mode": "formdata",
              "formdata": [{ "key": "file", "type": "file", "src": "" }]
            },
            "url": { "raw": "{{baseUrl}}/api/upload/video", "host": ["{{baseUrl}}"], "path": ["api", "upload", "video"] }
          }
        }
      ]
    }
  ]
}
