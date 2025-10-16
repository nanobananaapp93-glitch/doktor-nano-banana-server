# Generate API Endpoint Instructions

## Endpoint
`POST /api/generate`

## Request

### Headers
- `Content-Type: application/json`

### Query Parameters
- `deviceId` (optional): Device identifier (can also be sent in request body)

### Request Body
```typescript
{
  deviceId: string,           // Required: Device identifier
  prompt: string,             // Required: Edit instruction
  image_urls: string[],       // Required: One or more source image URLs
  style?: string,             // Optional: Style tag (reserved for future use)
  num_images?: number,        // Optional: Number of images to generate (default: 1)
  output_format?: string,     // Optional: Output format (default: 'jpeg')
  sync_mode?: boolean         // Optional: Sync mode (default: false)
}
```

## Response

### Success Response (200)
```typescript
{
  images: Array<{
    url: string
  }>,
  description: string,
  style: string | null
}
```

### Error Responses

#### 400 - Bad Request
```typescript
{
  error: string  // "Prompt, device identifier, and image_urls are required" or validation error
}
```

#### 402 - Payment Required
```typescript
{
  error: string  // "Insufficient credits"
}
```

#### 404 - Not Found
```typescript
{
  error: string  // "User not found for deviceId: {deviceId}"
}
```

#### 405 - Method Not Allowed
- Returned when using any HTTP method other than POST

#### 500 - Internal Server Error
```typescript
{
  error: string  // "Internal server error"
}
```

## Notes
- Each image edit costs 1 credit
- Credits are deducted from subscription credits first, then from extra credits
- The endpoint supports CORS and includes appropriate CORS headers
- Maximum request duration is 60 seconds