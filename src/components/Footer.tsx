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
  link_url: string | null; // Reusing this for custom links not in the main slug list
  is_active: boolean;
}

// Custom link type for non-CMS links (like Social)
interface CustomLink {
    key: string;
    value: string;
    link_url: string | null;
}

// FIX 1: Helper function to check if a URL is external (needs <a> tag)
const isExternal = (url: string | null): boolean => {
    if (!url) return false;
    // Checks for full URLs starting with http(s):// or mailto:
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:');
};

export const Footer = () => {
  // FIX 2: Consolidated state for Static Content and Custom Links
  const [staticData, setStaticData] = useState<{
    aboutContent: StaticPage[];
    quickLinks: StaticPage[];
    supportLinks: CustomLink[];
    contactLinks: CustomLink[];
    copyright: StaticPage[];
  }>({
    aboutContent: [],
    quickLinks: [], // Will store links based on 'slug' like /terms, /privacy
    supportLinks: [], // Custom links fetched for support/contact
    contactLinks: [],
    copyright: []
  });

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  // FIX 3: Fetching data from the new consolidated structure (Simulated)
  const fetchFooterSettings = async () => {
    // 1. Fetch all active Static Pages (Terms, Privacy, About, etc.)
    const { data: pageData, error: pageError } = await supabase
        .from('static_pages')
        .select('*')
        .eq('is_active', true)
        .order('slug');

    // 2. Fetch custom links that don't fit into static pages (e.g., social/contact details)
    // NOTE: If you are still using the footer_settings table for social/contact details, 
    // we need to uncomment the old fetching logic for 'contact'. For now, we mock/assume custom data fetch.

    if (pageError) {
        console.error("Error fetching static pages:", pageError);
        return;
    }

    const pages = pageData || [];
    
    // --- Manual grouping/creation of data for rendering ---
    const groupedData = {
        // About Content: Find the active 'about' page
        aboutContent: pages.filter(p => p.slug === 'about'),

        // Quick Links: Generate list for Footer (Terms, Privacy, About)
        quickLinks: [
            // Create dynamic link objects based on slugs found in the database
            // NOTE: URL is based on slug, title is based on page.title
            ...pages
                .filter(p => ['terms', 'privacy', 'about', 'shipping'].includes(p.slug))
                .map(p => ({
                    ...p, // includes id, slug, etc.
                    link_url: `/${p.slug}`, // Internal URL path
                    value: p.title || p.slug.replace('-', ' ') // Use title for display text
                })) as StaticPage[], 

            // Add any custom link_url items saved in the static_pages table (though slug is preferred)
            ...pages.filter(p => p.link_url && !['terms', 'privacy', 'about', 'shipping'].includes(p.slug))
        ],

        // Support Links (MOCK/TEMP: Needs custom table fetch if not pages)
        // Since you removed the footer table, we can only rely on custom hardcoded or 'contact' page data
        supportLinks: [
            // If you have a dedicated support page slug:
            // ...pages.filter(p => p.slug === 'support').map(p => ({ key: p.slug, value: p.title, link_url: `/${p.slug}`})),
            { key: 'help', value: 'Help Center', link_url: '/help' },
            { key: 'report', value: 'Report an Issue', link_url: '/report' },
        ] as CustomLink[],


        // Contact Links (MOCK/TEMP: Needs custom table fetch if not pages)
        contactLinks: [
            { key: 'linkedin', value: 'MyCampusKart', link_url: 'https://linkedin.com/campus' },
            { key: 'instagram', value: '@mycampuskart', link_url: 'https://instagram.com/campus' },
            { key: 'email', value: 'support@campus.com', link_url: 'mailto:support@campus.com' },
        ] as CustomLink[],

        // Copyright Content
        copyright: pages.filter(p => p.slug === 'copyright'),
    };
    
    setFooterData(groupedData);
  };
  // -------------------------------------------------------------

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
            {/* FIX: Display content instead of just link text */}
            {staticData.aboutContent.map((item) => (
              <p key={item.id} className="text-sm text-muted-foreground leading-relaxed">
                {item.content || 'Content not set in CMS for About Us.'}
              </p>
            ))}
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
                            {item.title}
                          </a>
                        ) : ( // Use <Link> for internal routes (e.g., /terms)
                          <Link
                            to={item.link_url}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.title}
                          </Link>
                        )
                      ) : (
                        <span className="text-sm text-muted-foreground">{item.title}</span>
                      )}
                    </li>
                  );
                })
              ) : (
                // Fallback for when no CMS links are active
                <>
                  <li><span className="text-sm text-muted-foreground">No links available (CMS not configured)</span></li>
                </>
              )}
            </ul>
          </div>

          {/* Support & Feedback Column (Custom links) */}
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

          {/* Connect With Us Column (Custom links, mostly social) */}
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
            {staticData.copyright.map((item) => (
              <p key={item.id}>{item.content || 'Copyright content not set.'}</p>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
