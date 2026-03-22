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
2. Select **Bambu Dashboard — E-commerce License**
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
2. Paste the **license key** in the field
3. Click **Activate license**
4. The dashboard authenticates the key against geektech.no servers
5. Upon successful activation, the license type, expiry date, and number of printers are shown

:::warning The license key is tied to your installation
The key is activated for one Bambu Dashboard installation. Contact [geektech.no](https://geektech.no) if you need to move the license to a new server.
:::

### License validation

- The license is **validated online** at startup and then every 24 hours
- In case of network outage, the license works for up to **7 days offline**
- Expired license → module is locked, but existing data is retained
- Renewal is done via **[geektech.no](https://geektech.no)** → My licenses → Renew

### Checking license status

Go to **Settings → E-commerce** or call the API:

```bash
curl -sk https://localhost:3443/api/ecom-license/status
```

The response contains:
```json
{
  "active": true,
  "type": "professional",
  "expires": "2027-03-22",
  "printers": 5,
  "licensee": "Company Name",
  "provider": "geektech.no"
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

See [Projects → Invoicing](../funksjoner/projects#fakturering) for detailed invoicing documentation.

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

## Reporting and taxes

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
- **Technical issues**: [GitHub Issues](https://github.com/skynett81/bambu-dashboard/issues)
- **Feature requests**: [GitHub Discussions](https://github.com/skynett81/bambu-dashboard/discussions)
:::
