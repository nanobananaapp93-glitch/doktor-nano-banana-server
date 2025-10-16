### GET /api/get_credits

- **Method**: GET
- **Query param**: `deviceId` (required)

### Successful request
Request:
```http
GET /api/get_credits?deviceId=YOUR_DEVICE_ID
```

Response (200):
```json
{
  "credits": 42,
  "extraCredits": 5
}
```

### Missing deviceId
Request:
```http
GET /api/get_credits
```

Response (400):
```json
{
  "error": "deviceId is required"
}
```

### Invalid deviceId or user not found (and other server errors)
Request:
```http
GET /api/get_credits?deviceId=INVALID_OR_UNKNOWN
```

Response (500):
```json
{
  "error": "An error occurred while processing your request"
}
```

### Wrong method
Request:
```http
POST /api/get_credits
```

Response (405):
```
Method Not Allowed
``` 