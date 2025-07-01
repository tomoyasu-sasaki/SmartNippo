// ========================================
// SEO and metadata types
// ========================================

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
}

export interface OpenGraphData {
  title: string;
  description: string;
  type?: string;
  image?: string;
  url?: string;
  site_name?: string;
}

export interface TwitterCardData {
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
}
