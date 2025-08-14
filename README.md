# Edges Africa C 2025 - Learning Management System

A comprehensive Learning Management System built for the African market, featuring modern design, robust functionality, and cultural relevance.

## 🚀 Features

### Core Functionality
- **Modern Landing Page** with hero section and course showcase
- **Course Marketplace** with grid/list views and advanced filtering
- **Role-based Dashboards** for Students, Instructors, and Admins
- **Authentication System** with social login support
- **Course Management** with progress tracking and certificates
- **Responsive Design** optimized for mobile, tablet, and desktop

### Design System
- **Brand Colors**: Dark Green (#006747), Golden Yellow (#F59741), Light Yellow (#FAEF5F), Sky Blue (#0A66EA)
- **Typography**: Grandissimo for headlines, Open Sans for body text
- **Africa-inspired Aesthetics** with modern, professional styling
- **Consistent 8px Spacing System** throughout the interface
- **Smooth Animations** and micro-interactions for enhanced UX

### Technical Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom brand configuration
- **State Management**: React Context API with TypeScript
- **Icons**: Lucide React
- **Authentication**: JWT-ready authentication system
- **Responsive**: Mobile-first responsive design

## 🎨 Brand Identity

### Colors
```css
Primary (Dark Green): #006747    /* African Earth */
Secondary (Golden): #F59741      /* Empowerment Glow */
Accent (Light Yellow): #FAEF5F   /* Future Shine */
Tech (Sky Blue): #0A66EA         /* Digital Horizon */
Foundation (Black): #000000      /* Foundation */
```

### Typography
- **Headlines**: Grandissimo (bold, distinctive)
- **Body Text**: Open Sans (clean, readable)
- High contrast ratios for accessibility

## 🛠 Installation & Setup

```bash
# Clone the repository
git clone <repository-url>
cd edges-africa-lms

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Components Overview

### Core Components
- **Navigation**: Responsive header with search, user menu, and mobile navigation
- **Hero**: Engaging hero section with CTA and video preview
- **CourseCard**: Flexible course display component (grid/list layouts)
- **StudentDashboard**: Comprehensive dashboard with stats, progress, and activities
- **AuthModal**: Modern authentication modal with social login options
- **Footer**: Rich footer with newsletter signup and social links

### Context & State Management
- **AuthContext**: Manages user authentication and authorization
- **TypeScript Interfaces**: Strongly typed data structures throughout

## 🎯 Pages & Views

### Implemented Views
1. **Home Page**: Hero section, featured courses, stats, and testimonials
2. **Course Listing**: Advanced filtering, search, and layout options
3. **Student Dashboard**: Progress tracking, recent activities, achievements
4. **Authentication**: Login/register modal with social options

### Planned Features
- Instructor Dashboard with course creation tools
- Admin Dashboard with analytics and user management
- Course Detail Page with lesson player
- Quiz System with various question types
- Certificate Generator with drag-and-drop builder
- Payment Integration (Stripe & Paystack)
- Video Player with progress tracking
- Discussion Forums and Q&A
- Advanced Analytics and Reporting

## 🗄 Database Schema (Planned)

### User Model
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  avatar?: string;
  isVerified: boolean;
  profile: {
    bio?: string;
    skills?: string[];
    location?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Course Model
```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string; // User ID
  price: number;
  originalPrice?: number;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  lessons: Lesson[];
  requirements?: string[];
  learningOutcomes: string[];
  tags: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔐 Security Features

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (RBAC)
- Email verification system
- Social login integration (Google, Facebook)
- Two-factor authentication support
- Session management
- Password encryption with bcrypt

### Content Security
- Input validation and sanitization
- CSRF protection
- Rate limiting
- File upload security
- Video content protection
- Quiz anti-cheating measures

## 📊 API Endpoints (Planned)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/login` | POST | User login | No |
| `/api/auth/register` | POST | User registration | No |
| `/api/auth/verify` | POST | Email verification | No |
| `/api/courses` | GET | Get all courses | No |
| `/api/courses/:id` | GET | Get single course | No |
| `/api/courses` | POST | Create course | Yes (Instructor) |
| `/api/courses/:id/enroll` | POST | Enroll in course | Yes |
| `/api/users/dashboard` | GET | Get dashboard data | Yes |
| `/api/quizzes/:id/submit` | POST | Submit quiz answers | Yes |
| `/api/certificates/generate` | POST | Generate certificate | Yes |

## 🌍 Internationalization

### Language Support
- English (Default)
- French (Français)
- Swahili (Kiswahili)
- Arabic (العربية)
- Portuguese (Português)

### RTL Support
- Right-to-left layout support for Arabic
- Dynamic text direction switching
- Culturally appropriate date/number formatting

## 📈 Performance Optimizations

### Frontend
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Bundle size optimization
- Service worker for caching
- Progressive Web App (PWA) features

### Backend (Planned)
- Database indexing strategies
- Caching with Redis
- CDN integration for static assets
- Video streaming optimization
- API response compression

## 🚀 Deployment Guide

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/edges-africa
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
PAYSTACK_SECRET_KEY=sk_test_...

# Cloud Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=edges-africa-media

# Social Auth
GOOGLE_CLIENT_ID=your-google-client-id
FACEBOOK_APP_ID=your-facebook-app-id
```

### Production Deployment
1. Configure environment variables
2. Set up MongoDB database
3. Configure AWS S3 for file storage
4. Set up payment gateways (Stripe & Paystack)
5. Configure email service (SendGrid, Mailgun)
6. Deploy to cloud platform (AWS, Vercel, Netlify)

## 🤝 Contributing

We welcome contributions to the Edges Africa LMS! Please read our contributing guidelines and code of conduct before submitting pull requests.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by African educational needs and cultural values
- Built with modern web technologies and best practices
- Designed for scalability and maintainability
- Community-driven development approach

---

**Edges Africa C 2025** - Empowering African Minds for Tomorrow 🌍