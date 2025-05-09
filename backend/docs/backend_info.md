# Backend Documentation

This document provides an overview of the recent changes to the backend, instructions for deploying the service, and guidelines for modifying the database models.

---

## Overview of Changes

### 1. New & Updated Features

- **Bulk Recycling-Point Operations**

  - Implemented `POST /recycling-points` for bulk create, update, and delete of recycling points.
  - Responses follow a **multi-status** pattern (HTTP 207) with separate sections for `new`, `updated`, `deleted`, and global `errors`.

- **GET Endpoint Enhancements**

  - `GET /recycling-points` now supports multiple query modes in the following priority:
    1. Material-optimal search (`material_ids`)
    2. Nearby search (`near_lat`, `near_lon`, optional `radius_km` and `max_results`)
    3. Single-point lookup (`point_id`)
    4. Council lookup (`gss_code`)
    5. Bounding-box search (`min_lat`, `max_lat`, `min_lon`, `max_lon`)
  - Input validation with appropriate HTTP codes (400, 422, 404).

- **Time-Slot Formatting**

  - Utility `format_time_slots` to convert Python `time` objects into `"HH:MM"` strings.

- **Database Migration**

  - Full recreation migration `7714910b1dbf_recreate_all_tables.py` using Alembic to define all tables:
    - `council`, `material`, `product`, `user`, `admin`, `product_material_association`, `recycling_point`, `recycle_history`, `recycle_history_product_association`.

- **Testing Suite Expansion**

  - Comprehensive tests for GET and POST endpoints covering success and failure scenarios, edge cases, and parameter validation.

- **Dependency Updates**

  - Added `alembic` and `black` to requirements.
  - Renamed `pydantic_settings` to `pydantic-settings` for compatibility.

---

## 2. Deployment Guide

### 2.1 Prerequisites

- **Python 3.10+** installed
- **PostgreSQL** database
- **Virtual environment** 

### 2.2 Installation

1. See README.md

### 2.3 Running the Server

1. See README.md

---

## 3. Modifying Database Models

1. See README.md

---


## 4. Further Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org)
- [Alembic Migrations](https://alembic.sqlalchemy.org)

---

