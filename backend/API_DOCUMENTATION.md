# Edges Africa LMS - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication Routes (`/api/auth`)

| Endpoint | Method | Description | Auth Required | Request Body | Response |
|----------|--------|-------------|---------------|--------------|----------|
| `/register` | POST | Register new user | No | `{ name, email, password, role? }` | `{ success, message, token, user }` |
| `/login` | POST | Login user | No | `{ email, password, twoFactorToken? }` | `{ success, message, token, user }` |
| `/verify-email` | POST | Verify email address | No | `{ token }` | `{ success, message }` |
| `/forgot-password` | POST | Send password reset email | No | `{ email }` | `{ success, message }` |
| `/reset-password` | POST | Reset password | No | `{ token, password }` | `{ success, message }` |
| `/me` | GET | Get current user | Yes | - | `{ success, user }` |
| `/setup-2fa` | POST | Setup 2FA | Yes | - | `{ success, secret, qrCode }` |
| `/verify-2fa` | POST | Verify and enable 2FA | Yes | `{ token }` | `{ success, message }` |
| `/disable-2fa` | POST | Disable 2FA | Yes | - | `{ success, message }` |

### Course Routes (`/api/courses`)

| Endpoint | Method | Description | Auth Required | Request Body | Response |
|----------|--------|-------------|---------------|--------------|----------|
| `/` | GET | Get all courses with filters | No | Query params: `page, limit, category, level, minPrice, maxPrice, rating, search, sort, featured, status` | `{ success, data, pagination }` |
| `/:id` | GET | Get single course | No | - | `{ success, data }` |
| `/` | POST | Create new course | Yes (Instructor/Admin) | `{ title, description, category, level, price, ... }` | `{ success, message, data }` |
| `/:id` | PUT | Update course | Yes (Course Owner/Admin) | `{ title?, description?, category?, ... }` | `{ success, message, data }` |
| `/:id` | DELETE | Delete course | Yes (Course Owner/Admin) | - | `{ success, message }` |
| `/:id/publish` | POST | Publish course | Yes (Course Owner/Admin) | - | `{ success, message, data }` |
| `/:id/students` | GET | Get course students | Yes (Course Owner/Admin) | - | `{ success, data }` |
| `/:id/upload-thumbnail` | POST | Upload course thumbnail | Yes (Course Owner/Admin) | FormData with `thumbnail` file | `{ success, message, data }` |

### Quiz Routes (`/api/quizzes`)

| Endpoint | Method | Description | Auth Required | Request Body | Response |
|----------|--------|-------------|---------------|--------------|----------|
| `/` | GET | Get all quizzes | Yes (Instructor/Admin) | Query params: `course, page, limit` | `{ success, data, pagination }` |
| `/:id` | GET | Get single quiz | Yes | - | `{ success, data }` |
| `/` | POST | Create new quiz | Yes (Instructor/Admin) | `{ title, course, questions, settings?, instructions? }` | `{ success, message, data }` |
| `/:id` | PUT | Update quiz | Yes (Quiz Owner/Admin) | `{ title?, questions?, settings?, ... }` | `{ success, message, data }` |
| `/:id` | DELETE | Delete quiz | Yes (Quiz Owner/Admin) | - | `{ success, message }` |
| `/:id/attempt` | POST | Submit quiz attempt | Yes (Student) | `{ answers, timeSpent? }` | `{ success, message, data }` |
| `/:id/attempts` | GET | Get student's quiz attempts | Yes (Student) | - | `{ success, data }` |

### User Routes (`/api/users`)

| Endpoint | Method | Description | Auth Required | Request Body | Response |
|----------|--------|-------------|---------------|--------------|----------|
| `/profile` | GET | Get user profile | Yes | - | `{ success, data }` |
| `/profile` | PUT | Update user profile | Yes | `{ name?, bio?, skills?, location?, ... }` | `{ success, message, data }` |
| `/upload-avatar` | POST | Upload user avatar | Yes | FormData with `avatar` file | `{ success, message, data }` |
| `/change-password` | POST | Change password | Yes | `{ currentPassword, newPassword }` | `{ success, message }` |
| `/` | GET | Get all users | Yes (Admin) | Query params: `page, limit, role, search` | `{ success, data, pagination }` |
| `/:id` | GET | Get user by ID | Yes (Admin) | - | `{ success, data }` |
| `/:id` | PUT | Update user | Yes (Admin) | `{ name?, email?, role?, isActive?, ... }` | `{ success, message, data }` |
| `/:id` | DELETE | Delete user | Yes (Admin) | - | `{ success, message }` |

### Enrollment Routes (`/api/enrollments`)

| Endpoint | Method | Description | Auth Required | Request Body | Response |
|----------|--------|-------------|---------------|--------------|----------|
| `/` | GET | Get user enrollments | Yes | Query params: `status, page, limit` | `{ success, data, pagination }` |
| `/enroll` | POST | Enroll in course | Yes | `{ courseId, enrollmentType? }` | `{ success, message, data }` |
| `/:id/progress` | GET | Get enrollment progress | Yes | - | `{ success, data }` |
| `/:id/complete-lesson` | POST | Mark lesson as complete | Yes | `{ lessonId, timeSpent? }` | `{ success, message, data }` |
| `/course/:courseId` | GET | Get course enrollments | Yes (Course Owner/Admin) | Query params: `page, limit, status` | `{ success, data, pagination }` |

### Payment Routes (`/api/payments`)

| Endpoint | Method | Description | Auth Required | Request Body | Response |
|----------|--------|-------------|---------------|--------------|----------|
| `/create-intent` | POST | Create payment intent | Yes | `{ courseId, paymentMethod }` | `{ success, data }` |
| `/confirm` | POST | Confirm payment | Yes | `{ paymentIntentId, courseId }` | `{ success, message, data }` |
| `/history` | GET | Get payment history | Yes | Query params: `page, limit` | `{ success, data, pagination }` |
| `/webhook/stripe` | POST | Stripe webhook | No | Stripe webhook payload | `{ received: true }` |
| `/webhook/paystack` | POST | Paystack webhook | No | Paystack webhook payload | `{ received: true }` |

### Certificate Routes (`/api/certificates`)

| Endpoint | Method | Description | Auth Required | Request Body | Response |
|----------|--------|-------------|---------------|--------------|----------|
| `/` | GET | Get user certificates | Yes | Query params: `page, limit` | `{ success, data, pagination }` |
| `/generate` | POST | Generate certificate | Yes | `{ courseId }` | `{ success, message, data }` |
| `/:id/download` | GET | Download certificate | Yes | - | Certificate PDF file |
| `/verify/:certificateId` | GET | Verify certificate | No | - | `{ success, data }` |
| `/templates` | GET | Get certificate templates | Yes (Instructor/Admin) | - | `{ success, data }` |
| `/templates` | POST | Create certificate template | Yes (Admin) | `{ name, design, elements }` | `{ success, message, data }` |

### Analytics Routes (`/api/analytics`)

| Endpoint | Method | Description | Auth Required | Request Body | Response |
|----------|--------|-------------|---------------|--------------|----------|
| `/dashboard` | GET | Get dashboard analytics | Yes | Query params: `period` | `{ success, data }` |
| `/courses/:id/stats` | GET | Get course statistics | Yes (Course Owner/Admin) | Query params: `period` | `{ success, data }` |
| `/revenue` | GET | Get revenue analytics | Yes (Instructor/Admin) | Query params: `period, courseId?` | `{ success, data }` |
| `/students` | GET | Get student analytics | Yes (Admin) | Query params: `period` | `{ success, data }` |

### Upload Routes (`/api/upload`)

| Endpoint | Method | Description | Auth Required | Request Body | Response |
|----------|--------|-------------|---------------|--------------|----------|
| `/image` | POST | Upload image | Yes | FormData with `image` file | `{ success, message, data }` |
| `/video` | POST | Upload video | Yes | FormData with `video` file | `{ success, message, data }` |
| `/document` | POST | Upload document | Yes | FormData with `document` file | `{ success, message, data }` |
| `/bulk` | POST | Upload multiple files | Yes | FormData with multiple files | `{ success, message, data }` |

## Error Responses

All endpoints return errors in the following format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors array
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP
- File upload endpoints: 10 requests per 15 minutes per IP

## File Upload Limits

- Images: 5MB max, formats: jpg, jpeg, png, gif
- Videos: 100MB max, formats: mp4, mov, avi
- Documents: 10MB max, formats: pdf, doc, docx
- Maximum 5 files per bulk upload request

## Pagination

Paginated endpoints return data in the following format:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "total": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Search and Filtering

### Course Filtering
- `category`: Filter by course category
- `level`: Filter by difficulty level
- `minPrice` / `maxPrice`: Price range filtering
- `rating`: Minimum rating filter
- `search`: Text search in title and description
- `sort`: Sort by newest, oldest, price-low, price-high, rating, popular
- `featured`: Show only featured courses

### User Filtering
- `role`: Filter by user role
- `search`: Search by name or email
- `isActive`: Filter by account status

## WebSocket Events (Future Implementation)

The API is designed to support real-time features through WebSocket connections:

- `course_updated`: Course content changes
- `new_enrollment`: New student enrollment
- `quiz_submitted`: Quiz attempt submission
- `message_received`: New Q&A message
- `certificate_issued`: Certificate generation complete

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation and sanitization
- File upload security
- CORS configuration
- Helmet security headers
- Two-factor authentication support