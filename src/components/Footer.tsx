import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Linkedin, Instagram, Mail, Home } from 'lucide-react';
import logo from '@/assets/mycampuskart-logo.png';

interface StaticPage {
  id: string;
  title: string;
  slug: string; // e.g., 'terms', 'privacy', 'about'
  content: string;
  version: string;
  link_url?: string | null;
  is_active: boolean;
  created_at: string | null;
  created_by?: string | null;
}

// Custom link type for hardcoded or social links
interface CustomLink {
    key: string;
    value: string;
    link_url: string | null;
}

// Helper function to check if a URL is external (needs <a> tag)
const isExternal = (url: string | null): boolean => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:');
};

export const Footer = () => {
  const [staticData, setStaticData] = useState<{
    aboutContent: StaticPage[];
    quickLinks: (StaticPage & { value: string })[];
    exploreLinks: (StaticPage & { value: string })[]; 
    supportLinks: CustomLink[];
    contactLinks: CustomLink[];
    copyright: StaticPage[];
  }>({
    aboutContent: [],
    quickLinks: [],
    exploreLinks: [],
    supportLinks: [],
    contactLinks: [],
    copyright: []
  });

  // Define the hardcoded Home Link object
  const homeLink: (StaticPage & { value: string }) = {
    id: 'home-link-hardcoded',
    title: 'Home',
    slug: 'home',
    content: '',
    version: '1',
    link_url: '/dashboard',  
    is_active: true,
    created_at: new Date().toISOString(),
    value: 'Home'
  };

  // Define the hardcoded Download App Link object
  const downloadApp: (StaticPage & { value: string }) = {
    id: 'download-app-hardcoded',
    title: 'Download App',
    slug: 'download-app',
    content: '',
    version: '1',
    link_url: 'https://mycampuskart.com/downloadmycampuskartapp', // External link
    is_active: true,
    created_at: new Date().toISOString(),
    value: 'Download App'
  };

  // Define the hardcoded Blog Link object
  const blogLink: (StaticPage & { value: string }) = {
    id: 'blog-link-hardcoded',
    title: 'Blog',
    slug: 'blog',
    content: '',
    version: '1',
    link_url: '/blog', // Relative path for React Router
    is_active: true,
    created_at: new Date().toISOString(),
    value: 'Blog'
  };

  // Define the hardcoded LPU Link object
  const lpuLink: (StaticPage & { value: string }) = {
    id: 'lpu-link-hardcoded',
    title: 'LPU Campus',
    slug: 'lpu-campus',
    content: '',
    version: '1',
    link_url: '/campus/lpu', // Relative path for React Router
    is_active: true,
    created_at: new Date().toISOString(),
    value: 'LPU Campus'
  };

  // Helper function for setting data to avoid repetition
  const setFooterData = (data: typeof staticData) => {
      setStaticData(data);
  };

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    // 1. Fetch all active Static Pages (latest version first)
    const { data: pageData, error: pageError } = await supabase
        .from('static_pages')
        .select('*')
        .eq('is_active', true)
        .order('slug')
        .order('version', { ascending: false });

    if (pageError) {
        console.error("Error fetching static pages:", pageError);
        // Include hardcoded links on error
        setFooterData({
            aboutContent: [],
            quickLinks: [homeLink, downloadApp], // Added Download App here
            exploreLinks: [blogLink, lpuLink], 
            supportLinks: [],
            contactLinks: [],
            copyright: [],
        });
        return;
    }

    const pages = pageData || [];
    
    // Ensure only unique (latest) active slugs are processed
    const uniquePagesMap = new Map<string, StaticPage>();
    for (const page of pages) {
        if (!uniquePagesMap.has(page.slug)) {
            uniquePagesMap.set(page.slug, page);
        }
    }
    const uniquePages = Array.from(uniquePagesMap.values());
    
    // Quick Links: Generate links for Terms, Privacy, About, Shipping
    const fetchedQuickLinks = uniquePages
        .filter(p => ['terms', 'privacy', 'about', 'shipping'].includes(p.slug))
        .map(current => ({
            ...current,
            link_url: `/${current.slug}`, 
            value: current.title || current.slug.replace('-', ' ') 
        }));

    // Quick Links now has Home + Download App + CMS pages
    const finalQuickLinks = [homeLink, downloadApp, ...fetchedQuickLinks];
    
    // Explore Links
    const finalExploreLinks = [blogLink, lpuLink];

    const groupedData = {
        // About Content
        aboutContent: uniquePages.filter(p => p.slug === 'about').slice(0, 1) as StaticPage[],

        quickLinks: finalQuickLinks, 
        
        exploreLinks: finalExploreLinks, 

        // Support Links
        supportLinks: [
            { key: 'help', value: 'Help Center', link_url: '/help' },
            { key: 'report', value: 'Report an Issue', link_url: 'https://forms.gle/NyAipeYYQDobkydr9' },
        ] as CustomLink[],

        // Contact Links
        contactLinks: [
            { key: 'linkedin', value: 'MyCampusKart', link_url: 'https://www.linkedin.com/company/mycampuskart' },
            { key: 'instagram', value: '@mycampuskart', link_url: 'https://instagram.com/mycampuskart' },
            { key: 'email', value: 'teammycampuskart@gmail.com', link_url: 'mailto:teammycampuskart.com' },
        ] as CustomLink[],

        // Copyright Content
        copyright: uniquePages.filter(p => p.slug === 'copyright').slice(0, 1) as StaticPage[],
    };
    
    setFooterData(groupedData);
  };

  const getSocialIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />;
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <footer className="border-t bg-card/50">
      <div className="container mx-auto px-4 py-12">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src={logo} 
            alt="MyCampusKart" 
            className="h-12"
          />
        </div>
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* About Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">About MyCampusKart</h3>
            {staticData.aboutContent.length > 0 ? (
                staticData.aboutContent.map((item) => (
                  <p key={item.id} className="text-sm text-muted-foreground leading-relaxed">
                    {item.content}
                  </p>
                ))
            ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Content not set in CMS. Please set the 'About' page content in Admin Panel.
                </p>
            )}
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {staticData.quickLinks.length > 0 ? (
                staticData.quickLinks.map((item) => {
                  const linkKey = item.id || item.slug;
                  const external = isExternal(item.link_url); 
                  return (
                    <li key={linkKey}>
                      {item.link_url ? (
                        external ? ( 
                          <a
                            href={item.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : ( 
                          <Link
                            to={item.link_url}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.value}
                          </Link>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                      )}
                  </li>
                  );
                })
              ) : (
                <li><span className="text-sm text-muted-foreground">No Quick Links configured.</span></li>
              )}
            </ul>
          </div>

          {/* Explore Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Explore</h3>
            <ul className="space-y-2">
              {staticData.exploreLinks.length > 0 ? (
                staticData.exploreLinks.map((item) => {
                  const linkKey = item.id || item.slug;
                  const external = isExternal(item.link_url); 
                  return (
                    <li key={linkKey}>
                      {item.link_url ? (
                        external ? ( 
                          <a
                            href={item.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : ( 
                          <Link
                            to={item.link_url}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.value}
                          </Link>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                      )}
                  </li>
                  );
                })
              ) : (
                <li><span className="text-sm text-muted-foreground">Nothing to explore right now.</span></li>
              )}
            </ul>
          </div>

          {/* Support & Feedback Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Support & Feedback</h3>
            <ul className="space-y-3">
              {staticData.supportLinks.map((item) => {
                const external = isExternal(item.link_url);
                return (
                  <li key={item.key}>
                    {item.link_url ? (
                      external ? (
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <Link
                          to={item.link_url}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                        >
                          {item.value}
                        </Link>
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Connect With Us Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Connect With Us</h3>
            <ul className="space-y-3">
              {staticData.contactLinks.map((item) => {
                const icon = getSocialIcon(item.key);
                return (
                  <li key={item.key}>
                    {item.link_url ? (
                      <a
                        href={item.link_url}
                        target={item.key !== 'email' ? '_blank' : undefined}
                        rel={item.key !== 'email' ? 'noopener noreferrer' : undefined}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                      >
                        {icon}
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        {icon}
                        {item.value}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t pt-6">
          <div className="text-center text-sm text-muted-foreground">
            {staticData.copyright.length > 0 ? (
                staticData.copyright.map((item) => (
                    <p key={item.id}>{item.content}</p>
                ))
            ) : (
                <p>Copyright © {new Date().getFullYear()} MyCampusKart. All rights reserved.</p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
```</Link>
