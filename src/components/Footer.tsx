import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Linkedin, Instagram, Mail } from 'lucide-react';
import logo from '@/assets/mycampuskart-logo.png';

interface StaticPage {
  id: string;
  title: string;
  slug: string; // e.g., 'terms', 'privacy', 'about'
  content: string;
  version: string;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
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
    supportLinks: CustomLink[];
    contactLinks: CustomLink[];
    copyright: StaticPage[];
  }>({
    aboutContent: [],
    quickLinks: [],
    supportLinks: [],
    contactLinks: [],
    copyright: []
  });

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
        // Fallback to empty state
        setFooterData({
            aboutContent: [],
            quickLinks: [],
            supportLinks: [],
            contactLinks: [],
            copyright: [],
        });
        return;
    }

    const pages = pageData || [];
    
    // --- Grouping and Link Creation Logic ---
    
    // Quick Links: Generate unique links for Terms, Privacy, About, Shipping
    const quickLinks = pages
        .filter(p => ['terms', 'privacy', 'about', 'shipping'].includes(p.slug))
        .reduce((acc, current) => {
            // Check for uniqueness by slug (to ensure only one version of 'terms' is used)
            if (!acc.some((item: any) => item.slug === current.slug)) {
                acc.push({
                    ...current,
                    // Internal URL path based on slug
                    link_url: `/${current.slug}`, 
                    // Display text (Footer uses 'title' from CMS)
                    value: current.title || current.slug.replace('-', ' ') 
                });
            }
            return acc;
        }, [] as (StaticPage & { value: string })[]);


    const groupedData = {
        // About Content: Only the first active 'about' page
        aboutContent: pages.filter(p => p.slug === 'about').slice(0, 1) as StaticPage[],

        quickLinks: quickLinks,

        // Support Links (Hardcoded/Temporary - Can be fetched from a custom table later if needed)
        supportLinks: [
            { key: 'help', value: 'Help Center', link_url: '/help' },
            { key: 'report', value: 'Report an Issue', link_url: '/report' },
        ] as CustomLink[],


        // Contact Links (Hardcoded/Temporary - Social Media)
        contactLinks: [
            { key: 'linkedin', value: 'MyCampusKart', link_url: 'https://linkedin.com/campus' },
            { key: 'instagram', value: '@mycampuskart', link_url: 'https://instagram.com/campus' },
            { key: 'email', value: 'support@campus.com', link_url: 'mailto:support@campus.com' },
        ] as CustomLink[],

        // Copyright Content: Only the first active 'copyright' page
        copyright: pages.filter(p => p.slug === 'copyright').slice(0, 1) as StaticPage[],
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
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

          {/* Quick Links Column (CMS pages) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {staticData.quickLinks.length > 0 ? (
                staticData.quickLinks.map((item) => {
                  const external = isExternal(item.link_url); 
                  return (
                    <li key={item.id}>
                      {item.link_url ? (
                        external ? ( // Use <a> for external links
                          <a
                            href={item.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : ( // Use <Link> for internal routes (e.g., /terms)
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
                // Fallback message now simplified
                <li><span className="text-sm text-muted-foreground">No Quick Links configured in CMS.</span></li>
              )}
            </ul>
          </div>

          {/* Support & Feedback Column (Hardcoded/Custom links) */}
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

          {/* Connect With Us Column (Hardcoded/Social links) */}
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
