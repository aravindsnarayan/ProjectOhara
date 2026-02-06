FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Firefox/Camoufox
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    # Firefox dependencies
    libgtk-3-0 \
    libdbus-glib-1-2 \
    libxt6 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxtst6 \
    libasound2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libxkbcommon0 \
    libxshmfence1 \
    libnss3 \
    libnspr4 \
    fonts-liberation \
    # Virtual display
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Camoufox browser
RUN python -m camoufox fetch

# Copy application
COPY . .

# Create data directory
RUN mkdir -p /app/data

EXPOSE 8000

# Camoufox uses its own virtual display when USE_VIRTUAL_DISPLAY=true
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
