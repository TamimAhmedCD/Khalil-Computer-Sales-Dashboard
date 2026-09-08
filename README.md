# Khalil Computer Management System

A modern, full-featured computer retail management system built with Next.js that provides comprehensive sales tracking, employee management, inventory control, and reporting capabilities for computer retail businesses.

## 🚀 Features

### 🔐 Authentication & Authorization
- **Role-based access control** (Super Admin, Admin, Employee)
- **JWT-based authentication** with NextAuth.js
- **Secure session management** with MongoDB adapter
- **Custom credential provider** with password validation

### 📊 Dashboard & Analytics
- **Multi-role dashboards** with tailored views for each user type
- **Interactive charts** and data visualizations using Recharts
- **Real-time sales tracking** and performance metrics
- **Revenue analytics** with commission calculations
- **Expense tracking** with category management

### 👥 Employee Management
- **Employee directory** with detailed profiles
- **Role assignment** (Sales Executive, Manager, Junior Associate)
- **Commission tracking** and sales performance metrics
- **Attendance and status management** (Active/Inactive)
- **Top performer identification** with leaderboards

### 💰 Sales & Transaction Management
- **Daily sales recording** with product details
- **Product catalog management** with categories
- **Transaction history** with filtering and search
- **Receipt generation** and PDF export capabilities
- **Sales commission calculations** based on performance

### 📦 Product Management
- **Complete product catalog** with images (Cloudinary integration)
- **Inventory tracking** with stock levels
- **Category organization** for easy navigation
- **Product editing** and variant management
- **Pricing and discount management**

### 📈 Reports & Analytics
- **Sales reports** with date filtering
- **Performance analytics** for employees and products
- **Revenue breakdown** by category and time period
- **Export capabilities** to PDF and Excel formats
- **Dashboard widgets** for quick insights

### 💸 Expense Management
- **Expense tracking** with categories
- **Receipt management** and documentation
- **Budget monitoring** and alerts
- **Expense approval workflow** (for admin users)
- **Financial reporting** with expense breakdowns

### 🔔 Notifications
- **Real-time notifications** for important events
- **Sales alerts** and performance milestones
- **System announcements** from administrators
- **Notification dropdown** with read/unread status

## 🛠️ Tech Stack

### Frontend
- **Next.js 16.2.2** - React framework with App Router
- **React 19.2.4** - UI library
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Component library with Radix UI primitives
- **Recharts** - Charting library for data visualization

### Backend
- **Next.js API Routes** - Serverless backend endpoints
- **MongoDB** - NoSQL database for flexible data modeling
- **NextAuth.js 5** - Authentication framework
- **Cloudinary** - Image and file storage

### State Management & Data Fetching
- **React Query (@tanstack/react-query)** - Server state management
- **React Hook Form** - Form validation and handling
- **Zod** - Schema validation for forms and API

### Utilities
- **date-fns** - Date manipulation
- **jspdf & jspdf-autotable** - PDF generation
- **xlsx** - Excel export functionality
- **lucide-react** - Icon library
- **axios** - HTTP client for API requests

## 📁 Project Structure

```
khalil-computer-management-system/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   │   ├── auth/          # Authentication routes
│   │   ├── admin/         # Admin-specific endpoints
│   │   ├── products/      # Product management endpoints
│   │   ├── expenses/      # Expense management endpoints
│   │   └── notifications/ # Notification endpoints
│   ├── (dashboard)/       # Dashboard layout groups
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── employee/      # Employee dashboard pages
│   │   └── super-admin/   # Super admin dashboard pages
│   ├── dashboard/         # Main dashboard entry point
│   ├── profile/           # User profile management
│   ├── settings/          # System settings
│   └── unauthorized/      # Access control pages
├── components/            # React components
│   ├── Admin/            # Admin-specific components
│   ├── Employee/         # Employee-specific components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── Profile/          # Profile-related components
│   └── sales/            # Sales form components
├── lib/                  # Utility functions and services
│   ├── mongodb.js        # MongoDB connection
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service functions
│   └── utils.js          # Utility functions
├── public/               # Static assets
├── auth.js               # NextAuth.js configuration
└── package.json          # Project dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or MongoDB Atlas)
- Cloudinary account for image storage

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd khalil-computer-management-system
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. **Set up environment variables**
Create a `.env` file in the root directory with the following variables:
```env
# MongoDB connection URI
DB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0

# Auth.js secret key (generate with: openssl rand -base64 32)
AUTH_SECRET=your-secret-key-here

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. **Open the application**
Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 👤 User Roles & Access

### Super Admin
- Full system access
- User role management
- System configuration
- All administrative functions

### Admin
- Employee management
- Product catalog management
- Sales tracking and reporting
- Expense approval
- Transaction monitoring

### Employee
- Daily sales entry
- Personal sales tracking
- View personal performance
- Access to assigned products
- Update personal profile

## 📱 Key Pages

### Login Page
- Modern, secure login interface
- Role-based redirection
- Form validation and error handling

### Admin Dashboard
- Sales overview with charts
- Employee performance metrics
- Revenue analytics
- Recent transactions
- System notifications

### Employee Dashboard
- Personal sales summary
- Performance metrics
- Daily sales entry form
- Product catalog access

### Product Management
- Product listing with grid/table views
- Category organization
- Image upload and management
- Stock level tracking

### Sales Management
- Daily sales recording
- Product selection with pricing
- Customer information capture
- Receipt generation

### Employee Management
- Staff directory
- Role and status management
- Performance tracking
- Commission calculations

### Reports
- Sales reports by date range
- Employee performance reports
- Product sales analysis
- Export to PDF/Excel

## 🔧 Configuration

### Database Setup
The system uses MongoDB for data storage. Make sure your MongoDB connection string is correctly configured in the `.env` file.

### Authentication
NextAuth.js handles authentication with a custom credentials provider. User roles are stored in the session token and used for authorization throughout the application.

### Cloudinary Integration
Product images are stored in Cloudinary. Configure your Cloudinary credentials in the `.env` file to enable image upload functionality.

### Styling
The application uses Tailwind CSS with custom configurations and shadcn/ui components for a consistent design system.

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Code Style
- ESLint configuration for code quality
- Prettier for consistent formatting
- Type-safe JavaScript with JSDoc annotations

### API Development
API routes are organized by functionality in the `app/api/` directory. Each route follows the Next.js App Router pattern for serverless functions.

## 📄 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables on Vercel
Make sure to set all required environment variables in your Vercel project settings.

### Building for Production
```bash
npm run build
```

## 📊 Database Schema

### Collections
- `credentials` - User authentication data
- `employees` - Employee profiles and performance data
- `products` - Product catalog with inventory
- `sales` - Sales transactions with commission data
- `expenses` - Business expenses with categories
- `categories` - Product and expense categories
- `notifications` - System notifications

## 🔐 Security Features

- **Password hashing** (planned for production)
- **JWT-based sessions**
- **Role-based access control**
- **Input validation** with Zod schemas
- **Secure MongoDB queries** with parameterization
- **CORS configuration** for API endpoints

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions about the Khalil Computer Management System, please contact the development team.

---

**Built with ❤️ for modern computer retail businesses**