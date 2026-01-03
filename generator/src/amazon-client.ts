import crypto from 'crypto';
import axios from 'axios';
import type { Product } from './types';

interface SearchOptions {
  minRating?: number;
  minReviews?: number;
  maxResults?: number;
  priceRange?: [number, number];
}

const config = {
  accessKey: process.env.AMAZON_ACCESS_KEY!,
  secretKey: process.env.AMAZON_SECRET_KEY!,
  partnerTag: process.env.AMAZON_PARTNER_TAG!,
  region: process.env.AMAZON_REGION || 'us-east-1'
};

const ENDPOINTS: Record<string, string> = {
  'us-east-1': 'webservices.amazon.com',
  'eu-west-1': 'webservices.amazon.co.uk',
  'us-west-2': 'webservices.amazon.ca'
};

export async function searchAmazonProducts(
  keyword: string,
  options: SearchOptions = {}
): Promise<Product[]> {
  const params = {
    Keywords: keyword,
    SearchIndex: 'All',
    ItemCount: Math.min(options.maxResults || 10, 10),
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.Features',
      'ItemInfo.ByLineInfo',
      'Offers.Listings.Price',
      'Offers.Listings.DeliveryInfo.IsPrimeEligible',
      'CustomerReviews.StarRating',
      'BrowseNodeInfo.BrowseNodes'
    ]
  };
  
  try {
    const response = await makeAmazonRequest('SearchItems', params);
    
    if (!response.SearchResult?.Items) {
      return [];
    }
    
    return response.SearchResult.Items
      .map(parseProductItem)
      .filter((p): p is Product => p !== null)
      .filter(p => {
        if (options.minRating && p.rating < options.minRating) return false;
        if (options.minReviews && p.reviewCount < options.minReviews) return false;
        if (options.priceRange) {
          const [min, max] = options.priceRange;
          if (p.price < min || p.price > max) return false;
        }
        return true;
      });
  } catch (error) {
    console.error('Amazon search error:', error);
    return [];
  }
}

async function makeAmazonRequest(
  operation: string,
  params: Record<string, any>
): Promise<any> {
  const host = ENDPOINTS[config.region];
  const path = '/paapi5/searchitems';
  
  const payload = {
    PartnerTag: config.partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com',
    ...params
  };
  
  const payloadString = JSON.stringify(payload);
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Host': host,
    'X-Amz-Date': timestamp,
    'X-Amz-Target': `com.amazon.paapi5.v1.ProductAdvertisingAPIv1.${operation}`
  };
  
  const signature = generateAWSSignature(
    'POST',
    path,
    payloadString,
    headers,
    timestamp
  );
  
  headers['Authorization'] = signature;
  
  const response = await axios.post(
    `https://${host}${path}`,
    payload,
    { headers, timeout: 10000 }
  );
  
  return response.data;
}

function generateAWSSignature(
  method: string,
  path: string,
  payload: string,
  headers: Record<string, string>,
  timestamp: string
): string {
  const dateStamp = timestamp.substring(0, 8);
  
  // Canonical request
  const canonicalHeaders = Object.entries(headers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`)
    .join('\n');
  
  const signedHeaders = Object.keys(headers)
    .map(k => k.toLowerCase())
    .sort()
    .join(';');
  
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
  
  const canonicalRequest = [
    method,
    path,
    '',
    canonicalHeaders,
    '',
    signedHeaders,
    payloadHash
  ].join('\n');
  
  // String to sign
  const credentialScope = [
    dateStamp,
    config.region,
    'ProductAdvertisingAPI',
    'aws4_request'
  ].join('/');
  
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timestamp,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');
  
  // Signing key
  const kDate = hmac(`AWS4${config.secretKey}`, dateStamp);
  const kRegion = hmac(kDate, config.region);
  const kService = hmac(kRegion, 'ProductAdvertisingAPI');
  const kSigning = hmac(kService, 'aws4_request');
  
  const signature = hmac(kSigning, stringToSign, 'hex');
  
  return `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

function hmac(key: string | Buffer, data: string, encoding?: 'hex'): any {
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  return encoding ? hmac.digest(encoding) : hmac.digest();
}

function parseProductItem(item: any): Product | null {
  try {
    const price = item.Offers?.Listings?.[0]?.Price?.Amount || 0;
    const rating = parseFloat(item.CustomerReviews?.StarRating?.Value || '0');
    const reviewCount = item.CustomerReviews?.Count || 0;
    
    if (!price || rating < 3.0) return null;
    
    return {
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || 'Unknown',
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      price,
      currency: item.Offers?.Listings?.[0]?.Price?.Currency || 'USD',
      imageUrl: item.Images?.Primary?.Large?.URL || '',
      description: item.ItemInfo?.Features?.DisplayValues?.join('. ') || '',
      features: item.ItemInfo?.Features?.DisplayValues || [],
      affiliateUrl: buildAffiliateUrl(item.DetailPageURL, item.ASIN),
      detailPageUrl: item.DetailPageURL,
      rating,
      reviewCount,
      isPrime: item.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible || false,
      isAmazonChoice: false,
      isBestSeller: item.BrowseNodeInfo?.BrowseNodes?.some((n: any) => n.SalesRank === 1) || false
    };
  } catch (error) {
    console.error('Parse error:', error);
    return null;
  }
}

function buildAffiliateUrl(baseUrl: string, asin: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('tag', config.partnerTag);
  url.searchParams.set('linkCode', 'll1');
  url.searchParams.set('linkId', Math.random().toString(36).substring(2, 15));
  return url.toString();
}
