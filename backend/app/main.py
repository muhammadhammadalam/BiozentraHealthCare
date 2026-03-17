from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.api.v1 import products, inventory, sales, orders, customers, invoices, suppliers
from app.routers import auth

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Biozentra Healthcare API",
    version="1.0.0",
    description="Backend API for Biozentra Healthcare Management Dashboard",
)

# CORS - allow frontend dev server and any deployed origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])

# Data endpoints
app.include_router(products.router,   prefix="/api/v1/products",   tags=["Products"])
app.include_router(inventory.router,  prefix="/api/v1/inventory",  tags=["Inventory"])
app.include_router(sales.router,      prefix="/api/v1/sales",      tags=["Sales"])
app.include_router(orders.router,     prefix="/api/v1/orders",     tags=["Orders"])
app.include_router(customers.router,  prefix="/api/v1/customers",  tags=["Customers"])
app.include_router(invoices.router,   prefix="/api/v1/invoices",   tags=["Invoices"])
app.include_router(suppliers.router,  prefix="/api/v1/suppliers",  tags=["Suppliers"])


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
