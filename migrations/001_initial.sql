-- Articles
CREATE TABLE articles (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    markdown_content TEXT NOT NULL,
    category TEXT NOT NULL,
    
    -- SEO
    meta_title TEXT,
    meta_description TEXT,
    keywords TEXT,
    
    -- Media
    cover_image TEXT,
    og_image TEXT,
    
    -- Products
    product_asins TEXT,
    
    -- Metadata
    author TEXT DEFAULT 'SwankyBoyz Editorial',
    read_time_minutes INTEGER,
    word_count INTEGER,
    
    -- Timestamps
    published_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT,
    
    -- Analytics
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'published', 'archived'))
);

-- Products
CREATE TABLE products (
    asin TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    
    -- Pricing
    price REAL,
    currency TEXT DEFAULT 'USD',
    was_price REAL,
    discount_percent INTEGER,
    
    -- Media
    image_url TEXT,
    additional_images TEXT,
    
    -- Details
    description TEXT,
    features TEXT,
    specifications TEXT,
    
    -- Amazon
    affiliate_url TEXT NOT NULL,
    detail_page_url TEXT,
    
    -- Quality
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_prime BOOLEAN DEFAULT 0,
    is_amazon_choice BOOLEAN DEFAULT 0,
    is_bestseller BOOLEAN DEFAULT 0,
    
    -- Tracking
    times_featured INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
    in_stock BOOLEAN DEFAULT 1
);

-- Analytics
CREATE TABLE analytics_daily (
    date TEXT NOT NULL,
    article_id TEXT,
    product_asin TEXT,
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    avg_time_seconds INTEGER DEFAULT 0,
    PRIMARY KEY (date, article_id, product_asin)
);

-- Click events
CREATE TABLE click_events (
    id TEXT PRIMARY KEY,
    article_id TEXT,
    product_asin TEXT,
    click_context TEXT,
    device_type TEXT,
    referrer TEXT,
    clicked_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Generation log
CREATE TABLE generation_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger TEXT,
    topic TEXT,
    article_id TEXT,
    products_featured INTEGER,
    generation_time_ms INTEGER,
    openai_tokens_used INTEGER,
    amazon_api_calls INTEGER,
    success BOOLEAN,
    error_message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_rating ON products(rating DESC);
CREATE INDEX idx_products_featured ON products(times_featured DESC);
CREATE INDEX idx_analytics_date ON analytics_daily(date DESC);
CREATE INDEX idx_clicks_article ON click_events(article_id, clicked_at);
