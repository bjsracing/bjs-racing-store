# Overview

This is a Spray Paint and Motorcycle Parts E-commerce application called "BJS Racing Store" built with Astro and React. The application specializes in spray paint products (pilok) and Federal Part motorcycle parts distribution. It features a comprehensive shopping system with cart functionality, user authentication, address management with interactive maps, shipping cost calculation, and internationalization support.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The application uses Astro as the primary framework with React components for interactive features. The architecture follows a hybrid approach:

- **Astro Pages**: Server-side rendered pages for better SEO and performance
- **React Components**: Interactive components like forms, maps, and shopping cart
- **Styling**: TailwindCSS for utility-first styling approach
- **State Management**: Zustand for global state management with persistence
- **Internationalization**: astro-i18next for multi-language support

## Authentication & Authorization

The application implements Supabase Auth with middleware-based route protection:

- **Authentication Provider**: Supabase Auth with SSR support
- **Route Protection**: Custom middleware that protects specific routes like `/cart`, `/checkout`, `/akun`
- **Session Management**: Server-side session handling with cookie-based storage
- **User Profiles**: Customer profiles linked to auth users in the database

## Data Management

The application uses a multi-layered data management approach:

- **Database**: Supabase PostgreSQL with comprehensive schema including customers, products, addresses, sales orders, and transactions
- **State Management**: Zustand store for cart items, addresses, and form state with localStorage persistence
- **API Layer**: Astro API routes for server-side operations and third-party integrations

## Key Features Architecture

### Shopping Cart System
- Persistent cart state using Zustand with localStorage
- Weight calculation for shipping costs
- Product management with quantity controls

### Address Management
- Interactive map integration using React Leaflet
- Coordinate-based address selection with lat/lng storage
- Multiple address support with primary address designation

### Shipping Integration
- Komerce/RajaOngkir API for shipping cost calculation
- Support for regular, cargo, and instant shipping services
- Real-time shipping cost calculation based on weight and destination

### Image Processing
- Browser-based image compression for uploads
- Color extraction using ColorThief library

## Database Schema Design

The database follows a normalized structure with key entities:

- **Customers**: User profiles with authentication integration
- **Products**: Inventory management with categorization (spray paint, motorcycle parts)
- **Customer Addresses**: Multi-address support with geocoding
- **Sales Orders**: Transaction management with order tracking
- **Special Pricing**: Customer-specific pricing (daftar_harga_mitra)
- **Inventory Tracking**: Stock management and low stock alerts

## Progressive Web App Features

The application is configured as a PWA with:
- Service worker for offline functionality
- Web app manifest for native app-like experience
- Caching strategies for improved performance

# External Dependencies

## Core Framework Dependencies
- **Astro**: Primary framework for SSR and static site generation
- **React**: Component library for interactive features
- **TailwindCSS**: Utility-first CSS framework

## Authentication & Database
- **Supabase**: Backend-as-a-Service for authentication and PostgreSQL database
- **@supabase/ssr**: Server-side rendering support for Supabase
- **@supabase/auth-ui-react**: Pre-built authentication UI components

## State Management & Storage
- **Zustand**: Lightweight state management library
- **Nanostores**: Atomic state management (legacy, being replaced by Zustand)

## Maps & Location Services
- **Leaflet**: Open-source mapping library
- **React Leaflet**: React bindings for Leaflet

## Shipping & Location APIs
- **Komerce/RajaOngkir API**: Indonesian shipping cost calculation service
- Used for destination search and shipping rate calculation

## Image Processing
- **browser-image-compression**: Client-side image compression
- **colorthief**: Color palette extraction from images

## Internationalization
- **i18next**: Internationalization framework
- **astro-i18next**: Astro integration for i18next

## UI & Icons
- **React Icons**: Icon library for React components

## Development & Build Tools
- **TypeScript**: Type safety and enhanced development experience
- **PostCSS & Autoprefixer**: CSS processing and vendor prefixing

## Deployment
- **Vercel**: Hosting and deployment platform via @astrojs/vercel adapter