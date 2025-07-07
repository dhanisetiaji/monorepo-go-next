# Boilerplate Monorepo Project

A modern boilerplate monorepo setup with Go backend (JWT Auth + PostgreSQL) and Next.js frontend using Turborepo for efficient development and deployment.

## Project Structure

```
monorepo/
├── apps/
│   ├── backend/              # Go API server dengan JWT Auth
│   │   ├── config/           # Database configuration
│   │   ├── controllers/      # Auth, User, Role controllers
│   │   ├── middleware/       # Authentication middleware
│   │   ├── models/          # Database models (User, Role, Permission)
│   │   ├── main.go          # Server utama dengan protected routes
│   │   └── go.mod           # Dependencies (Gin, GORM, JWT, PostgreSQL)
│   └── web/                 # Next.js frontend dengan Auth UI
│       ├── app/
│       ├── components/      # Auth components (Login, Register)
│       ├── lib/            # Authentication service
│       ├── package.json
│       ├── tailwind.config.js
│       └── next.config.js
├── packages/             # Shared packages (future)
├── package.json          # Root package.json
├── turbo.json           # Turborepo configuration
├── Makefile             # Development commands
└── README.md
```

## Tech Stack

### Frontend (Next.js)
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Authentication UI** - Login/Register components
- **ESLint** - Code linting

### Backend (Go)
- **Gin** - HTTP web framework
- **GORM** - ORM untuk PostgreSQL
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### Database
- **PostgreSQL 15** - Production database
- **Auto Migration** - GORM auto migration
- **Multi-Role System** - Dynamic role-based permissions

### Authentication & Authorization
- **JWT Tokens** - Stateless authentication
- **Role-Based Access Control (RBAC)** - Dynamic permissions
- **Multi-Role Support** - Users can have multiple roles
- **Permission System** - Resource-action based permissions

### Development Tools
- **Turborepo** - Monorepo build system
- **npm workspaces** - Package management
- **Makefile** - Development shortcuts

## Getting Started

### Prerequisites
- Node.js 18+ 
- Go 1.21+
- npm or yarn

### Quick Start

1. **Automated Setup (Recommended):**
```bash
./start-dev.sh
```

2. **Manual Installation:**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd apps/web && npm install && cd ../..

# Install backend dependencies
cd apps/backend && go mod download && cd ../..
```

3. **Test Setup:**
```bash
./test-setup.sh
```

### Development

#### Start with Database (Recommended)

**Option 1: Complete setup with PostgreSQL**
```bash
make dev-with-db
```

**Option 2: Manual database + apps**
```bash
# Terminal 1 - Start PostgreSQL
make db-up

# Terminal 2 - Start both apps (after DB is ready)
npm run dev
```

#### Start without Database (limited functionality)

**Option 1: Using Turborepo**
```bash
npm run dev
```

**Option 2: Using parallel script**
```bash
./dev-parallel.sh
```

#### Start individually

**PostgreSQL only:**
```bash
make db-up          # Start database
make db-down        # Stop database
make db-reset       # Reset database (delete data)
```

**Backend only:**
```bash
cd apps/backend && npm run dev
# or
cd apps/backend && go run main.go
```

**Frontend only:**
```bash
cd apps/web && npm run dev
```

### URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432
- Health check: http://localhost:8080/health

## API Endpoints

### Public Endpoints (No Auth Required)
- `GET /health` - Server health status
- `GET /api/v1/hello` - Hello message
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Protected Endpoints (Auth Required)
- `GET /api/v1/auth/me` - Current user info
- `POST /api/v1/auth/logout` - Logout

### User Management (Requires Permissions)
- `GET /api/v1/users` - Get all users (requires users.read)
- `GET /api/v1/users/:id` - Get user by ID (requires users.read)
- `POST /api/v1/users` - Create user (requires users.write)
- `PUT /api/v1/users/:id` - Update user (requires users.write)
- `DELETE /api/v1/users/:id` - Delete user (requires users.delete)
- `POST /api/v1/users/:id/roles` - Assign roles (requires admin role)

### Role Management (Requires Permissions)
- `GET /api/v1/roles` - Get all roles (requires roles.read)
- `GET /api/v1/roles/:id` - Get role by ID (requires roles.read)
- `POST /api/v1/roles` - Create role (requires roles.write)
- `PUT /api/v1/roles/:id` - Update role (requires roles.write)
- `DELETE /api/v1/roles/:id` - Delete role (requires roles.delete)

### Permissions
- `GET /api/v1/permissions` - Get all permissions (requires permissions.read)

## Available Scripts

### Root Level
- `npm run dev` - Start development servers
- `npm run build` - Build all applications
- `npm run lint` - Lint all applications
- `npm run clean` - Clean build artifacts

### Backend (Go)
- `make backend-dev` - Start Go server
- `make backend-build` - Build Go binary
- `make backend-test` - Run Go tests
- `make backend-clean` - Clean build artifacts

### Frontend (Next.js)
- `make web-dev` - Start Next.js dev server
- `make web-build` - Build Next.js application
- `make web-test` - Run frontend tests

### 🔧 Development Scripts Available:

```bash
./start-dev.sh          # Complete setup + start both apps
./dev-parallel.sh       # Start both apps in parallel
./test-setup.sh         # Test if everything builds correctly
./test-connection.sh    # Test API connection between frontend/backend
```

## Project Features

✅ **Monorepo Setup** - Turborepo for efficient builds and caching  
✅ **Go Backend** - RESTful API with Gin framework  
✅ **Next.js Frontend** - Modern React with App Router  
✅ **Tailwind CSS** - Utility-first styling  
✅ **TypeScript** - Type safety across the frontend  
✅ **CORS Configuration** - Proper cross-origin setup  
✅ **Development Tools** - ESLint, Prettier, and more  
✅ **Hot Reload** - Both frontend and backend support hot reload  

## Deployment

### Backend
```bash
cd apps/backend
go build -o bin/main main.go
./bin/main
```

### Frontend
```bash
cd apps/web
npm run build
npm start
```

## Environment Variables

### Backend
- `PORT` - Server port (default: 8080)
- `GIN_MODE` - Gin mode (debug/release)

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Troubleshooting

### Development Servers Not Starting Together

If `npm run dev` doesn't start both applications:

1. **Check if both apps have package.json with dev scripts:**
   ```bash
   # Should exist: apps/backend/package.json with "dev": "go run main.go"
   # Should exist: apps/web/package.json with "dev": "next dev"
   ```

2. **Use alternative methods:**
   ```bash
   # Option 1: Parallel script
   ./dev-parallel.sh
   
   # Option 2: Manual start in separate terminals
   # Terminal 1:
   cd apps/backend && go run main.go
   
   # Terminal 2:
   cd apps/web && npm run dev
   ```

3. **Test individual components:**
   ```bash
   # Test backend only
   cd apps/backend && go run main.go
   
   # Test frontend only (in new terminal)
   cd apps/web && npm run dev
   
   # Test connection
   ./test-connection.sh
   ```

### Turbo Configuration Issues
If you encounter `turbo_json_parse_error` with unknown key errors, make sure you're using the correct turbo version specified in package.json. The configuration format has changed between versions:

- Turbo v1.x uses `pipeline` key
- Turbo v2.x uses `tasks` key

Current project uses Turbo v1.13.4 with `pipeline` configuration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License
