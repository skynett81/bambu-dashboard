---
sidebar_position: 9
title: Projects
description: Organize prints into projects, track costs, generate invoices, and share projects with customers
---

# Projects

Projects let you group related prints, track material costs, invoice customers, and share an overview of your work.

Go to: **https://localhost:3443/#projects**

## Creating a project

1. Click **New project** (+ icon)
2. Fill in:
   - **Project name** — descriptive name (max 100 characters)
   - **Customer** — optional customer account (see [E-commerce](../integrations/ecommerce))
   - **Description** — short text description
   - **Color** — choose a color for visual identification
   - **Tags** — comma-separated keywords
3. Click **Create project**

## Linking prints to a project

### During a print

1. Open the dashboard while a print is in progress
2. Click **Link to project** in the side panel
3. Select an existing project or create a new one
4. The print is automatically linked to the project when it completes

### From history

1. Go to **History**
2. Find the relevant print
3. Click on the print → **Link to project**
4. Select project from the dropdown

Print history entries can now have 3MF files linked for 3D preview — see [Print History](./history#3d-preview).

### Bulk linking

1. Select multiple prints in history using checkboxes
2. Click **Actions → Link to project**
3. Select project — all selected prints are linked

## Cost overview

Each project calculates total costs based on:

| Cost type | Source |
|---|---|
| Filament consumption | Grams × price per gram per material |
| Electricity | kWh × electricity price (from Tibber/Nordpool if configured) |
| Machine wear | Calculated from [Wear Prediction](../monitoring/wearprediction) |
| Manual cost | Free-text entries you add manually |

The cost overview is displayed as a table and pie chart per print and in total.

:::tip Electricity rates
Enable the Tibber or Nordpool integration for accurate electricity costs per print. See [Energy](../integrations/energy).
:::

## Invoicing

1. Open a project and click **Generate invoice**
2. Fill in:
   - **Invoice date** and **due date**
   - **VAT rate** (0%, 15%, 25%)
   - **Markup** (%)
   - **Note to customer**
3. Preview the invoice in PDF format
4. Click **Download PDF** or **Send to customer** (via email)

Invoices are saved under the project and can be reopened and edited until they are sent.

:::info Customer data
Customer data (name, address, org. number) is pulled from the customer account linked to the project. See [E-commerce](../integrations/ecommerce) to manage customers.
:::

## Project status

| Status | Description |
|---|---|
| Active | Project is in progress |
| Completed | All prints are done, invoice sent |
| Archived | Hidden from the default view, but searchable |
| On hold | Temporarily paused |

Change status by clicking the status indicator at the top of the project.

## Sharing a project

Generate a shareable link to show the project overview to customers:

1. Click **Share project** in the project menu
2. Choose what to show:
   - ✅ Prints and images
   - ✅ Total filament consumption
   - ❌ Costs and prices (hidden by default)
3. Set expiration time for the link
4. Copy and share the link

The customer sees a read-only page without logging in.
