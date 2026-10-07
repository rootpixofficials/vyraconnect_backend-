# Vyra Connect API Documentation

This API supports the Vehicle QR Safety Platform, structured around a RESTful design.

## Base URL
`http://localhost:5000/api`

---

## 1. Authentication

### `POST /auth/admin/login`
Authenticates an admin user and returns a JWT.
- **Body**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "token": "jwt_token_here", "admin": { ... } }`

---

## 2. Customers

### `GET /admin/customers`
Returns a paginated list of customers.
- **Query Params**: `?page=1&limit=10&search=Nihal&status=ACTIVE`

### `POST /admin/customers`
Creates a new customer.
- **Body**: `{ "full_name": "...", "mobile": "...", "email": "..." }`

### `GET /admin/customers/:id`
Returns a single customer with their vehicles, emergency contacts, and assigned QR codes.

### `PATCH /admin/customers/:id/status`
Updates customer status (`ACTIVE`, `BLOCKED`, etc.).

---

## 3. QR Codes & Batches

### `GET /admin/qr`
Retrieves a list of all QR codes.

### `POST /admin/qr/generate`
Generates a single new QR code.
- **Body**: `{ "product_type": "BIKE", "customer_id": "optional_uuid" }`

### `POST /admin/qr/bulk-generate`
Generates a batch of QR codes and a downloadable PDF.
- **Body**: `{ "product_type": "BIKE", "quantity": 100 }`
- **Response**: `{ "batch_id": "uuid", "pdf_path": "/path/to/pdf" }`

### `POST /admin/qr/:id/assign`
Assigns a QR code to a customer.
- **Body**: `{ "customer_id": "uuid" }`

### `GET /admin/qr/:id/audit`
Returns the lifecycle audit history of a specific QR code.

---

## 4. Vehicles

### `POST /admin/customers/:customerId/vehicles`
Adds a vehicle to a customer.
- **Body**: `{ "vehicle_type": "BIKE", "registration_number": "KL-10...", ... }`

### `GET /admin/vehicles/:id`
Retrieves vehicle details, including registration history.

---

## 5. Emergency Contacts

### `POST /admin/customers/:customerId/emergency-contacts`
Adds an emergency contact to a customer's profile.
- **Body**: `{ "name": "...", "relationship": "...", "mobile": "...", "is_primary": true }`

---

## 6. Public QR Scan Flow

### `GET /public/qr/:token`
The endpoint called when a QR code is scanned physically.
- **Path Param**: `token` (e.g., `K7X92P4M8A`)
- **Response behavior**: 
  - If `AVAILABLE`: Directs user to claim/register flow.
  - If `ACTIVE`: Returns emergency contact and safe vehicle data.
  - If `BLOCKED`: Returns unauthorized/blocked status.

---

## 7. Reporting & Analytics

### `GET /admin/reports/dashboard`
Returns high-level statistics for the admin dashboard.
- **Response**: `{ "total_customers": 1248, "active_qrs": 1120, "expiring_products": 15 }`
