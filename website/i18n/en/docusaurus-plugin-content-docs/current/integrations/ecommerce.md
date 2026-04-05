---
sidebar_position: 5
title: E-commerce
description: Manage orders, customers, and invoicing for selling 3D prints — requires a license from geektech.no
---

# E-commerce

The E-commerce module gives you a complete system for managing customers, orders, and invoicing — perfect for those who sell 3D prints professionally or semi-professionally.

Go to: **https://localhost:3443/#orders**

:::danger E-commerce license required
The E-commerce module requires a valid license. Licenses can **only be purchased via [geektech.no](https://geektech.no)**. Without an active license, the module is locked and inaccessible.
:::

## License — purchase and activation

### Purchasing a license

1. Go to **[geektech.no](https://geektech.no)** and create an account
2. Select **3DPrintForge — E-commerce License**
3. Choose license type:

| License type | Description | Printers |
|---|---|---|
| **Hobby** | One printer, personal use and small sales | 1 |
| **Professional** | Up to 5 printers, commercial use | 1–5 |
| **Enterprise** | Unlimited printers, full support | Unlimited |

4. Complete payment
5. You receive a **license key** by email

### Activating the license

1. Go to **Settings → E-commerce** in the dashboard
2. Fill in the following fields:

| Field | Description | Required |
|-------|-------------|----------|
| **License key** | 32-character hex key from geektech.no | ✅ Yes |
| **Email address** | The email you used when purchasing | ✅ Yes |
| **Domain** | The domain the dashboard runs on (without https://) | Recommended |
| **Phone** | Contact phone (with country code, e.g. +1) | Optional |

### License type — identifier binding

geektech.no binds the license to one or more identifiers:

| Type | Validates against | Use case |
|------|-------------------|----------|
| **Domain** | Domain name (e.g. `dashboard.company.com`) | Fixed server with own domain |
| **IP** | Public IP address(es) | Server without domain, fixed IP |
| **MAC** | MAC address(es) of the network card | Hardware binding |
| **IP + MAC** | Both IP and MAC must match | Highest security |

:::info Automatic identification
The dashboard automatically sends the server's IP address and MAC address with each validation. You do not need to fill these in manually — geektech.no registers them at first activation.
:::

Multiple IP addresses and MAC addresses can be allowed (one per line in the geektech.no admin). This is useful for servers with multiple network cards or dynamic IP.

3. Click **Activate license**
4. The dashboard sends an activation request to geektech.no
5. Upon successful activation, the following are shown:
   - **License type** (Hobby / Professional / Enterprise)
   - **Expiry date**
   - **Max number of printers**
   - **License holder**
   - **Instance ID** (unique to your installation)

:::warning The license key is tied to your domain and installation
The key is activated for one specific 3DPrintForge installation and domain. Contact [geektech.no](https://geektech.no) support if you need to:
- Move the license to a new server
- Change domain
- Increase number of printers
:::

### License validation

The license is authenticated and synchronized with geektech.no:

- **Validation at startup** — the license is checked automatically
- **Ongoing validation** — revalidated every 24 hours against geektech.no
- **Offline mode** — in case of network outage, the license works for up to **7 days** with cached validation
- **Expired license** → the module is locked, but existing data (orders, customers) is retained
- **PIN code** — geektech.no can lock/unlock the license via the PIN system
- **Renewal** — via **[geektech.no](https://geektech.no)** → My licenses → Renew

### License types and restrictions

| Plan | Printers | Platforms | Fee | Price |
|------|----------|-----------|-----|-------|
| **Hobby** | 1 | 1 (Shopify OR WooCommerce) | 5% | See geektech.no |
| **Professional** | 1–5 | All | 5% | See geektech.no |
| **Enterprise** | Unlimited | All + API | 3% | See geektech.no |

### Checking license status

Go to **Settings → E-commerce** or call the API:

```bash
curl -sk https://localhost:3443/api/ecommerce/license
```

The response contains:
```json
{
  "active": true,
  "status": "active",
  "plan": "professional",
  "holder": "Company Name Ltd",
  "email": "company@example.com",
  "domain": "dashboard.companyname.com",
  "max_printers": 5,
  "expires_at": "2027-03-22",
  "provider": "geektech.no",
  "fees_pending": 2,
  "fees_this_month": 450.00,
  "orders_this_month": 12
}
```

## Customers

### Creating a customer

1. Go to **E-commerce → Customers**
2. Click **New customer**
3. Fill in:
   - **Name / Company name**
   - **Contact person** (for businesses)
   - **Email address**
   - **Phone**
   - **Address** (billing address)
   - **Org. number / Personal ID** (optional, for VAT-registered)
   - **Note** — internal memo
4. Click **Create**

### Customer overview

The customer list shows:
- Name and contact info
- Total number of orders
- Total revenue
- Last order date
- Status (Active / Inactive)

Click on a customer to see all order and invoice history.

## Order management

### Creating an order

1. Go to **E-commerce → Orders**
2. Click **New order**
3. Select **Customer** from the list
4. Add order lines:
   - Select file/model from the file library, or add a free-text entry
   - Set quantity and unit price
   - System calculates cost automatically if linked to a project
5. Set **Delivery date** (estimated)
6. Click **Create order**

### Order status

| Status | Description |
|---|---|
| Inquiry | Request received, not confirmed |
| Confirmed | Customer has confirmed |
| In production | Prints in progress |
| Ready for delivery | Done, waiting for pickup/shipping |
| Delivered | Order completed |
| Cancelled | Cancelled by customer or you |

Update status by clicking the order → **Change status**.

### Link prints to order

1. Open the order
2. Click **Link print**
3. Select prints from history (multiple selection supported)
4. Cost data is automatically pulled from print history

## Invoicing

See [Projects → Invoicing](../features/projects#invoicing) for detailed invoicing documentation.

An invoice can be generated directly from an order:

1. Open the order
2. Click **Generate invoice**
3. Check amounts and VAT
4. Download PDF or send to the customer's email

### Invoice number series

Set up invoice number series under **Settings → E-commerce**:
- **Prefix**: e.g. `2026-`
- **Start number**: e.g. `1001`
- Invoice numbers are assigned automatically in ascending order

## Reporting and fees

### Fee reporting

The system tracks all transaction fees:
- View fees under **E-commerce → Fees**
- Mark fees as reported for accounting purposes
- Export fee summary per period

### Statistics

Under **E-commerce → Statistics**:
- Monthly revenue (bar chart)
- Top customers by revenue
- Best-selling models/materials
- Average order size

Export to CSV for accounting systems.

## Support and contact

:::info Need help?
- **License questions**: contact [geektech.no](https://geektech.no) support
- **Technical issues**: [GitHub Issues](https://github.com/skynett81/3dprintforge/issues)
- **Feature requests**: [GitHub Discussions](https://github.com/skynett81/3dprintforge/discussions)
:::
