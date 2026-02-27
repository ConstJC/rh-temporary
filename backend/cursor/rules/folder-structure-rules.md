# Folder Structure Rules

This document defines the comprehensive folder structure standards for the project, based on the established patterns for modular NestJS applications using Prisma ORM.

## 📋 General Folder Structure Standards

### Module Structure
Every module must follow this standardized folder structure:

```
[module-name]/
├── dto/
│   ├── create-[entity].dto.ts
│   ├── update-[entity].dto.ts
│   ├── find-[entities].dto.ts
│   └── [entity]-specific.dto.ts
├── services/
│   └── [entity].service.ts
├── guards/
│   └── [entity]-specific.guard.ts (optional)
├── strategies/
│   └── [entity]-strategy.ts (optional)
├── types/
│   ├── [entity].types.ts
│   └── index.ts
├── [entity].controller.ts
├── [entity].module.ts
└── [entity].enum.ts (optional)
```

## 🏗️ Layer-Specific Rules

### Types Layer (`types/`)
The types layer contains TypeScript interfaces and type definitions:

**Required Files:**
- `[entity].types.ts` - Main type definitions for the entity
- `index.ts` - Barrel export file for clean imports

**Naming Conventions:**
- Use kebab-case for file names: `user.types.ts`
- Use PascalCase for interface names: `UserResponse`
- Use descriptive names that clearly indicate purpose

**Content Standards:**
- Define response interfaces for API contracts
- Include request/response type definitions
- Use Prisma-generated types when possible
- Export all types through index.ts for clean imports

### DTO Layer (`dto/`)
The DTO layer contains data transfer objects for API communication:

**Required Files:**
- `create-[entity].dto.ts` - For entity creation operations
- `update-[entity].dto.ts` - For entity update operations
- `find-[entities].dto.ts` - For query/filter operations
- `[entity]-specific.dto.ts` - For specialized operations (e.g., `login.dto.ts`)

**Naming Conventions:**
- Use kebab-case for all file names
- Use descriptive action names: `create-`, `update-`, `find-`
- Use singular form for single entity operations
- Use descriptive names for specialized DTOs

**Content Standards:**
- Include proper validation decorators
- Use class-validator and class-transformer
- Include API documentation decorators (@ApiProperty)
- Follow OpenAPI specifications
- Keep DTOs focused on single responsibilities

### Services Layer (`services/`)
The services layer contains business logic and data access using Prisma:

**Required Files:**
- `[entity].service.ts` - Main service with business logic

**Naming Conventions:**
- Use kebab-case for file names: `user.service.ts`
- Use descriptive names that reflect functionality

**Content Standards:**
- Use PrismaService for database operations
- Implement proper error handling
- Include comprehensive JSDoc documentation
- Keep business logic separate from data access
- Use Prisma-generated types for type safety
- Implement proper validation and sanitization

### Controller Layer (Root Level)
The controller layer contains HTTP endpoints and request handling:

**Required Files:**
- `[entity].controller.ts` - HTTP controller with API endpoints
- `[entity].module.ts` - Module configuration
- `[entity].enum.ts` - Enums specific to the entity (optional)

**Naming Conventions:**
- Use kebab-case for all file names
- Use singular form for controller and module files
- Use descriptive names that reflect functionality

**Content Standards:**
- Controllers should handle HTTP requests/responses only
- Use proper decorators (@Get, @Post, @Put, @Delete)
- Include comprehensive API documentation (@ApiTags, @ApiOperation)
- Implement proper error handling and validation
- Keep controllers thin - delegate business logic to services

## 🎯 File Organization Rules

### Types Layer Organization
```
types/
├── [entity].types.ts             # Main type definitions
└── index.ts                      # Barrel export file
```

**Examples:**
- `user.types.ts` - User-related type definitions
- `auth.types.ts` - Authentication-related types
- `index.ts` - Exports all types for clean imports

### DTO Layer Organization
```
dto/
├── create-[entity].dto.ts        # Creation operations
├── update-[entity].dto.ts        # Update operations
├── find-[entities].dto.ts        # Query operations
└── [entity]-specific.dto.ts      # Specialized operations
```

**Examples:**
- `create-user.dto.ts` - Create user
- `update-user.dto.ts` - Update user
- `find-users.dto.ts` - Query users
- `login.dto.ts` - User login
- `refresh-token.dto.ts` - Token refresh

### Services Layer Organization
```
services/
└── [entity].service.ts           # Business logic service
```

**Examples:**
- `user.service.ts` - User business logic
- `auth.service.ts` - Authentication business logic
- `product.service.ts` - Product business logic

### Controller Layer Organization
```
[module-name]/
├── [entity].controller.ts        # HTTP controller
├── [entity].module.ts            # Module configuration
└── [entity].enum.ts              # Entity-specific enums (optional)
```

**Examples:**
- `user.controller.ts` - User HTTP endpoints
- `user.module.ts` - User module configuration
- `user.enum.ts` - User status, roles, etc.

## 🔧 Technical Standards

### File Naming Conventions
- **Use kebab-case** for all file names
- **Use singular form** for single entity files
- **Use plural form** for multiple entity files
- **Use descriptive names** that clearly indicate purpose
- **Use consistent suffixes** (.dto.ts, .entity.ts, .service.ts, etc.)

### Directory Naming Conventions
- **Use kebab-case** for all directory names
- **Use singular form** for single entity directories
- **Use plural form** for multiple entity directories
- **Use descriptive names** that clearly indicate purpose

### Import/Export Standards
- **Use relative imports** within the same module
- **Use absolute imports** for cross-module dependencies
- **Use barrel exports** (index.ts) for clean imports
- **Use consistent import ordering** (external, internal, relative)

### TypeScript Standards
- **Use proper TypeScript types** throughout
- **Use interfaces** for complex type definitions
- **Use enums** for related constants
- **Use generics** for reusable components
- **Use proper access modifiers** (public, private, protected)

## 📝 Implementation Guidelines

### 1. Start with Prisma Schema
- Define your database schema in `prisma/schema.prisma`
- Generate Prisma client with `npx prisma generate`
- Use Prisma-generated types throughout the application

### 2. Create Types
- Define TypeScript interfaces for API contracts
- Use Prisma-generated types when possible
- Create response/request type definitions

### 3. Create DTOs
- Define DTOs for all API operations
- Include proper validation rules with class-validator
- Add API documentation decorators (@ApiProperty)

### 4. Implement Services
- Create services that use PrismaService for data access
- Implement business logic and validation
- Handle errors appropriately

### 5. Build Controllers
- Create HTTP controllers with proper decorators
- Keep controllers thin - delegate to services
- Add comprehensive API documentation

### 6. Configure Modules
- Set up module dependencies properly
- Import required services and providers
- Export services for use in other modules

## 🚀 Quality Standards

### Completeness
- Every module must have all required files
- Every layer must be properly implemented
- Every file must follow naming conventions

### Consistency
- Use consistent naming across all modules
- Follow the same structure for similar modules
- Maintain consistent code organization

### Clarity
- Use descriptive file and directory names
- Organize files logically by purpose
- Keep related files together

### Maintainability
- Structure should be easy to navigate
- Files should have single responsibilities
- Dependencies should be clear and minimal

## 📚 Reference Examples

### Complete Module Structure (Prisma-based)
```
users/
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   ├── find-users.dto.ts
│   └── update-user-role.dto.ts
├── services/
│   └── user.service.ts
├── types/
│   ├── user.types.ts
│   └── index.ts
├── user.controller.ts
├── user.module.ts
└── user.enum.ts
```

### Authentication Module Structure
```
auth/
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   ├── refresh-token.dto.ts
│   ├── reset-password.dto.ts
│   └── verify-email.dto.ts
├── services/
│   └── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── refresh-jwt.strategy.ts
├── guards/
│   └── jwt-auth.guard.ts
├── types/
│   ├── auth.types.ts
│   └── index.ts
├── auth.controller.ts
└── auth.module.ts
```

### Product Module Structure
```
products/
├── dto/
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   ├── find-products.dto.ts
│   └── product-search.dto.ts
├── services/
│   └── product.service.ts
├── types/
│   ├── product.types.ts
│   └── index.ts
├── product.controller.ts
├── product.module.ts
└── product.enum.ts
```

## 🎯 Best Practices

### Module Design
- Keep modules focused on single business domains
- Minimize dependencies between modules
- Use clear, descriptive module names
- Follow consistent patterns across modules

### File Organization
- Group related files together
- Use subdirectories for complex modules
- Keep file names descriptive and consistent
- Follow established naming conventions

### Code Organization
- Use proper TypeScript types
- Implement proper error handling
- Follow SOLID principles
- Maintain clean code standards

### Documentation
- Include comprehensive JSDoc comments
- Document all public APIs
- Provide usage examples
- Keep documentation up-to-date

## 🔍 Validation Checklist

### Before Creating a New Module
- [ ] Define the database schema in `prisma/schema.prisma`
- [ ] Generate Prisma client with `npx prisma generate`
- [ ] Determine the module name and purpose
- [ ] Identify all required DTOs
- [ ] Plan the service layer implementation
- [ ] Design the API endpoints

### During Implementation
- [ ] Create all required directories
- [ ] Define types and interfaces
- [ ] Create all necessary DTOs with validation
- [ ] Implement service layer with PrismaService
- [ ] Build controller layer
- [ ] Configure module dependencies
- [ ] Add enums and constants if needed

### After Implementation
- [ ] Verify all files follow naming conventions
- [ ] Check that all layers are properly implemented
- [ ] Ensure proper dependency injection
- [ ] Validate that module is self-contained
- [ ] Test all functionality works correctly
- [ ] Verify Prisma types are used correctly

## 📖 Reference Documentation

### Related Rules
- [JSDoc Documentation Rules](./jsdoc-rules.md)
- [HTTP Files Documentation Rules](./http-files-rules.md)

### External Resources
- [NestJS Module System](https://docs.nestjs.com/modules)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Class Validator Documentation](https://github.com/typestack/class-validator)
- [OpenAPI Documentation](https://swagger.io/specification/)
- [NestJS Prisma Integration](https://docs.nestjs.com/recipes/prisma)
