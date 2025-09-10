# Overview

BJS RACING STORE is a comprehensive e-commerce Progressive Web Application (PWA) built with Astro and React. The application serves as a distributor platform for spray paint products and motorcycle parts, featuring a complete shopping experience with user authentication, product catalog, shopping cart, checkout system, and address management. The system includes internationalization support and integrates with Supabase for backend services and RajaOngkir API for Indonesian shipping calculations.

## Recent Major Updates (September 2025)
- **Production-Ready Cart System**: Completely rebuilt cart functionality with atomic operations, proper error handling, and professional UX
- **Security Hardening**: Implemented enterprise-grade security with RLS policies and secure RPC functions  
- **Professional UX**: Modern toast notification system replacing blocking alerts
- **Database Optimization**: Atomic cart operations eliminating race conditions and performance bottlenecks

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Astro 5.12.0 with React 19.1.1 integration for interactive components
- **Styling**: Tailwind CSS for utility-first styling with responsive design
- **State Management**: Hybrid approach using Zustand for client-side state and Nanostores for specific reactive data
- **Internationalization**: i18next with astro-i18next for multi-language support (Indonesian as primary)
- **PWA Features**: Complete Progressive Web App setup with service worker, manifest.json, and offline capabilities
- **Component Strategy**: Server-side rendering for static content with client-side hydration for interactive components

## Backend Architecture
- **Runtime**: Server-side rendering with Astro's hybrid deployment model
- **Authentication**: Supabase Auth with SSR support using cookie-based sessions
- **Middleware**: Custom authentication middleware for route protection and session management
- **API Layer**: Astro's file-based API routes for server-side operations
- **Database Integration**: Supabase client with separate server/client configurations for optimal performance

## Data Storage Solutions
- **Primary Database**: Supabase (PostgreSQL) with comprehensive schema including:
  - User management (customers, authentication)
  - Product catalog (products, pricing, inventory)
  - E-commerce features (transactions, sales orders, invoices)
  - Address management (customer addresses with shipping integration)
  - Business analytics (expenses, profit/loss calculations)
- **State Management**: Zustand store for cart, addresses, and application state
- **Caching Strategy**: Service worker implementation with stale-while-revalidate pattern for API responses

## Authentication and Authorization
- **Provider**: Supabase Auth with email/password authentication
- **Session Management**: Server-side session handling with secure cookie storage
- **Route Protection**: Middleware-based protection for authenticated routes (/cart, /checkout, /akun/*)
- **User Profiles**: Linked customer profiles with Supabase Auth users
- **Authorization**: Row Level Security (RLS) policies in Supabase for data access control

# External Dependencies

## Core Services
- **Supabase**: Backend-as-a-Service providing authentication, database, and real-time features
- **Vercel**: Deployment platform with serverless functions and edge computing
- **RajaOngkir API**: Indonesian shipping cost calculation service with domestic shipping rates

## Third-Party Libraries
- **UI/UX**: React Icons for iconography, ColorThief for image color extraction
- **Image Processing**: Browser-image-compression for client-side image optimization
- **Development Tools**: TypeScript for type safety, PostCSS and Autoprefixer for CSS processing

## API Integrations
- **Shipping Calculation**: RajaOngkir Starter API for domestic Indonesian shipping costs
- **Payment Processing**: Infrastructure ready for payment gateway integration
- **Address Validation**: RajaOngkir destination search for Indonesian addresses

## Development Environment
- **Package Manager**: npm with lockfile version 3
- **Build System**: Astro's optimized build process with automatic code splitting
- **Development Server**: Hot module replacement with host binding for development
- **Code Quality**: ESLint configuration through Astro's strict TypeScript preset