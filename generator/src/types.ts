export interface Product {
  asin: string;
  title: string;
  brand?: string;
  category?: string;
  price: number;
  currency: string;
  wasPrice?: number;
  discountPercent?: number;
  imageUrl: string;
  additionalImages?: string[];
  description: string;
  features?: string[];
  specifications?: Record<string, string>;
  affiliateUrl: string;
  detailPageUrl: string;
  rating: number;
  reviewCount: number;
  isPrime: boolean;
  isAmazonChoice: boolean;
  isBestSeller: boolean;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  markdownContent: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  coverImage: string;
  productAsins: string[];
  author: string;
  readTimeMinutes: number;
  wordCount: number;
}

export interface NicheConfig {
  niche: {
    name: string;
    tagline: string;
    target_audience: {
      age: string;
      income: string;
      interests: string[];
      pain_points: string[];
    };
  };
  categories: Record<string, {
    name: string;
    keywords: string[];
    amazon_browse_nodes: string[];
  }>;
  content_strategy: {
    tone: string;
    value_proposition: string;
    article_structure: {
      education_percentage: number;
      recommendation_percentage: number;
    };
    product_integration: {
      max_per_article: number;
      quality_threshold: {
        min_rating: number;
        min_reviews: number;
      };
    };
  };
  publishing: {
    frequency: string;
    preferred_time: string;
    articles_per_week: number;
  };
}
