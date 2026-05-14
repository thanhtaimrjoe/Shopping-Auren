# Product Database UI Design Documentation

**Project**: Shopping Memo
**Created**: 2026-05-14
**Author**: AI Assistant
**Purpose**: Document UI-Database mapping for Product Database feature

---

## 1. Overview

The Product Database UI provides a comprehensive interface for managing household products (miscellaneous/grocery items) in the Shopping Memo application. This document maps each UI component to its corresponding database schema and API specification.

## 2. Database Schema Reference

### 2.1 Products Table Structure

```
Table: products
├── id (UUID, PK) - Unique identifier
├── user_id (UUID, FK) - Reference to auth.users
├── name (VARCHAR 100, NOT NULL) - Product name
├── image_url (TEXT, NULLABLE) - Product image URL
├── category (VARCHAR 50, NOT NULL) - Category: daily/consumable/other
├── created_at (TIMESTAMP) - Creation timestamp
├── updated_at (TIMESTAMP) - Last update timestamp
└── deleted_at (TIMESTAMP, NULLABLE) - Soft delete timestamp
```

### 2.2 Category Enum Values

| Value | UI Label | Color Code | Description |
|-------|----------|------------|-------------|
| `daily` | Daily | Blue-100/Blue-700 | Essential daily items |
| `consumable` | Consumable | Amber-100/Amber-700 | Items that get used up |
| `other` | Other | Purple-100/Purple-700 | Miscellaneous items |

## 3. UI-Database Mapping

### 3.1 Main Layout (Split-View)

```
┌──────────────────────────────────────────────────────────────────┐
│  Header Toolbar                                                    │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐  │
│  │ "Product Database"      │  │ [+ Add New Product]           │  │
│  │ Subtitle: Inventory      │  │ (→ POST /api/v1/products)     │  │
│  └─────────────────────────┘  └──────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────┐  ┌──────────────────────────────┐   │
│  │ LEFT PANEL (40%)       │  │ RIGHT PANEL (60%)            │   │
│  │                        │  │                              │   │
│  │ ┌──────────────────┐   │  │ ┌────────────────────────┐   │   │
│  │ │ Search Input     │   │  │ │ Product Image Preview  │   │   │
│  │ │ (name filter)    │   │  │ │ (image_url field)      │   │   │
│  │ └──────────────────┘   │  │ └────────────────────────┘   │   │
│  │                        │  │                              │   │
│  │ ┌──────────────────┐   │  │ ┌────────────────────────┐   │   │
│  │ │ Filter Buttons   │   │  │ │ Product Name Input    │   │   │
│  │ │ [All][Daily]...  │   │  │ │ (name field)          │   │   │
│  │ └──────────────────┘   │  │ └────────────────────────┘   │   │
│  │                        │  │                              │   │
│  │ ┌──────────────────┐   │  │ ┌────────────────────────┐   │   │
│  │ │ Sort Controls    │   │  │ │ Category Select       │   │   │
│  │ │ Name | Date      │   │  │ │ (category field)       │   │   │
│  │ └──────────────────┘   │  │ └────────────────────────┘   │   │
│  │                        │  │                              │   │
│  │ ┌──────────────────┐   │  │ ┌────────────────────────┐   │   │
│  │ │ Product Cards     │   │  │ │ Image URL Input        │   │   │
│  │ │ (paginated list)  │   │  │ │ (image_url field)      │   │   │
│  │ │                  │   │  │ └────────────────────────┘   │   │
│  │ │ - name           │   │  │                              │   │
│  │ │ - category badge │   │  │ ┌────────────────────────┐   │   │
│  │ │ - created date   │   │  │ │ Timestamps (readonly)  │   │   │
│  │ │ - delete button  │   │  │ │ created_at, updated_at │   │   │
│  │ └──────────────────┘   │  │ └────────────────────────┘   │   │
│  │                        │  │                              │   │
│  │ ┌──────────────────┐   │  │ ┌────────────────────────┐   │   │
│  │ │ Pagination       │   │  │ │ [Edit] [Save] [Cancel]│   │   │
│  │ │ < 1 2 3 >       │   │  │ └────────────────────────┘   │   │
│  │ └──────────────────┘   │  └──────────────────────────────┘   │
│  └────────────────────────┘                                    │
└──────────────────────────────────────────────────────────────────┘
```

## 4. API Endpoints & Operations

### 4.1 CRUD Operations Mapping

| Operation | API Endpoint | UI Action | Data Flow |
|-----------|-------------|-----------|-----------|
| **Create** | `POST /products` | Click "Add New Product" → Fill form → Save | Form data → API → Update list |
| **Read** | `GET /products` | Page load / Search / Filter | API → Display list |
| **Update** | `PUT /products/{id}` | Select item → Click Edit → Modify → Save | Form data → API → Update detail |
| **Delete** | `DELETE /products/{id}` | Click delete icon → Confirm → OK | API → Remove from list |

### 4.2 Query Parameters

| Parameter | Type | Source | Purpose |
|-----------|------|--------|---------|
| `category` | string | Filter buttons | Filter by category enum |
| `search` | string | Search input | ILIKE search on name field |

## 5. UI Components Specification

### 5.1 Product Card

```
┌─────────────────────────────────────┐
│ [Image]  Product Name    [Delete]   │
│  56x56   [Category]                │
│  rounded  Added: date              │
└─────────────────────────────────────┘

Fields:
- imageUrl → Image thumbnail (56x56, rounded-2xl)
- name → Bold text, truncate if long
- category → Colored badge (daily/consumable/other)
- createdAt → "Added: {date}" text
```

### 5.2 Product Detail/Edit Panel

```
┌─────────────────────────────────────────┐
│ Header Section                           │
│ ┌─────┐ Product Name          [Edit]    │
│ │Image│ ID: abc123...                     │
│ └─────┘                                   │
├─────────────────────────────────────────┤
│ Form Fields                              │
│ ┌─────────────────────────────────────┐  │
│ │ Product Name (text input)            │  │
│ └─────────────────────────────────────┘  │
│ ┌─────────────────────────────────────┐  │
│ │ Category (select dropdown)           │  │
│ │ Options: daily/consumable/other      │  │
│ └─────────────────────────────────────┘  │
│ ┌─────────────────────────────────────┐  │
│ │ Image URL (url input)                │  │
│ └─────────────────────────────────────┘  │
├─────────────────────────────────────────┤
│ Footer Actions                           │
│ [Cancel]                    [Save]       │
└─────────────────────────────────────────┘
```

### 5.3 Empty State

```
┌─────────────────────────────────────────┐
│                                          │
│           ┌──────────────┐               │
│           │  [Icon]     │               │
│           │  96x96      │               │
│           └──────────────┘               │
│                                          │
│        "No Product Selected"            │
│                                          │
│   Select a product from the list to    │
│   view details or add a new one...      │
│                                          │
└─────────────────────────────────────────┘
```

## 6. Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|--------------|
| < 1024px (Mobile) | Single column, full-width panels stacked |
| ≥ 1024px (Desktop) | Split-view: 40% left list, 60% right detail |

## 7. State Management

### 7.1 Local States

| State | Type | Purpose |
|-------|------|---------|
| `products` | Product[] | Cached product list |
| `selectedProduct` | Product \| null | Currently selected item |
| `searchQuery` | string | Search filter value |
| `filterCategory` | string | Category filter value |
| `isEditing` | boolean | Edit mode toggle |
| `isAdding` | boolean | Add new mode toggle |
| `notification` | {type, message} \| null | Toast notification |

### 7.2 Form State

| Field | Source | Validation |
|-------|--------|------------|
| `name` | `formState.name` | Required, 1-100 chars |
| `category` | `formState.category` | Required, enum value |
| `imageUrl` | `formState.imageUrl` | Optional, valid URL format |

## 8. Validation Rules

| Rule | Field | Error Message | UI Feedback |
|------|-------|---------------|-------------|
| Required | `name` | "Tên sản phẩm là bắt buộc" | Error notification |
| Max length | `name` | "Tên quá dài" | Input border red |
| Enum value | `category` | "Loại không hợp lệ" | Select option disabled |

## 9. User Interactions & Feedback

| Action | Visual Feedback | Duration |
|--------|----------------|----------|
| Save success | Green toast notification | 3 seconds |
| Save error | Red toast notification | 3 seconds |
| Delete click | Confirmation modal | Until confirm/cancel |
| Delete success | Green toast + list refresh | 3 seconds |
| Loading | Spinner icon on save button | Until API response |
| Hover on card | Slight background color change | Immediate |
| Click card | Blue border highlight | Immediate |

## 10. File Structure

```
frontend/src/
├── app/
│   ├── products/
│   │   └── page.tsx          # Main products CRUD page
│   ├── meals/
│   │   └── page.tsx          # Meals CRUD page (similar pattern)
│   └── ...
└── components/
    └── Sidebar.tsx           # Navigation with products link
```

## 11. Design System Compliance

All UI components follow the established design system:

- **Colors**: Sage, Cream, Bark, Hemp (from `globals.css`)
- **Typography**: Serif headings (Fraunces), Sans body (Outfit)
- **Spacing**: 4px base grid, generous whitespace
- **Border Radius**: `rounded-2xl` (cards), `rounded-3xl` (modals)
- **Shadows**: `shadow-soft` for cards, `shadow-warm` for modals
- **Animations**: `animate-in fade-in slide-in` for transitions

---

**Last Updated**: 2026-05-14
**Version**: 1.0
