export interface Env {
  DB: D1Database;
}

export interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  markdown_content: string;
  category: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  product_asins?: string;
  author?: string;
  read_time_minutes?: number;
  word_count?: number;
  published_at?: string;
  views?: number;
  clicks?: number;
}

export interface ProductRow {
  asin: string;
  title: string;
  brand?: string;
  price?: number;
  image_url?: string;
  rating?: number;
  review_count?: number;
  in_stock?: boolean;
}
