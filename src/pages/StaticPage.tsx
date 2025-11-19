
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Footer } from '@/components/Footer'; // Footer for layout consistency

interface StaticPageContent {
  title: string;
  content: string;
  version: string;
  created_at: string;
}

const StaticPage = () => {
  const location = useLocation();
  const slug = location.pathname.split('/')[1] || ''; // Extracts 'privacy' or 'terms'
  const [pageContent, setPageContent] = useState<StaticPageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchStaticContent(slug);
    }
  }, [slug]);

  const fetchStaticContent = async (currentSlug: string) => {
    setLoading(true);
    // Fetch the active page content based on the slug
    const { data, error } = await supabase
      .from('static_pages')
      .select('title, content, version, created_at')
      .eq('slug', currentSlug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setPageContent(null);
      console.error(`Error fetching content for slug ${currentSlug}:`, error);
    } else {
      setPageContent(data);
    }
    setLoading(false);
  };

  const displayTitle = pageContent?.title || slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{displayTitle}</CardTitle>
            {pageContent && (
              <p className="text-sm text-muted-foreground">Version {pageContent.version} | Last Updated: {new Date(pageContent.created_at).toLocaleDateString()}</p>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pageContent ? (
              <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {/* Content ko pre-wrap mein wrap kiya hai taki new lines dikhein */}
                {pageContent.content}
              </div>
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-semibold text-destructive">404 - Content Not Found</h3>
                <p className="text-muted-foreground">The page content for '/{slug}' is not active or does not exist in the CMS.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default StaticPage;
