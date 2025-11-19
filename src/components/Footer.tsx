import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Linkedin, Instagram, Mail } from 'lucide-react';
import logo from '@/assets/mycampuskart-logo.png';

interface FooterSetting {
  id: string;
  section: string;
  key: string;
  value: string;
  link_url: string | null;
  sort_order: number;
}

// FIX 1: Helper function to check if a URL is external (needs <a> tag)
const isExternal = (url: string | null): boolean => {
    if (!url) return false;
    // Checks for full URLs starting with http(s):// or mailto:
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:');
};

export const Footer = () => {
  const [footerData, setFooterData] = useState<{
    about: FooterSetting[];
    quickLinks: FooterSetting[];
    support: FooterSetting[];
    contact: FooterSetting[];
    copyright: FooterSetting[];
  }>({
    about: [],
    quickLinks: [],
    support: [],
    contact: [],
    copyright: []
  });

  useEffect(() => {
    fetchFooterSettings();
  }, []);

  const fetchFooterSettings = async () => {
    const { data, error } = await supabase
      .from('footer_settings')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (!error && data) {
      const grouped = {
        about: data.filter(item => item.section === 'about'),
        quickLinks: data.filter(item => item.section === 'quick_links'),
        support: data.filter(item => item.section === 'support'),
        contact: data.filter(item => item.section === 'contact'),
        copyright: data.filter(item => item.section === 'copyright')
      };
      setFooterData(grouped);
    }
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
            {footerData.about.map((item) => (
              <p key={item.id} className="text-sm text-muted-foreground leading-relaxed">
                {item.value}
              </p>
            ))}
          </div>

          {/* Quick Links Column - FIX 2: Dynamic link handling */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {footerData.quickLinks.length > 0 ? (
                footerData.quickLinks.map((item) => {
                  const external = isExternal(item.link_url); // Check external status
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
                        ) : ( // Use <Link> for internal routes
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
                <>
                  {/* Default links fallback */}
                  <li>
                    <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Terms & Conditions
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Support & Feedback Column - FIX 3: Dynamic link handling */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Support & Feedback</h3>
            <ul className="space-y-3">
              {footerData.support.map((item) => {
                const external = isExternal(item.link_url); // Check external status
                return (
                  <li key={item.id}>
                    {item.link_url ? (
                      external ? ( // Use <a> for external links
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                        >
                          {item.value}
                        </a>
                      ) : ( // Use <Link> for internal routes
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

          {/* Connect With Us Column (Already uses <a> tag, good) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Connect With Us</h3>
            <ul className="space-y-3">
              {footerData.contact.map((item) => {
                const icon = getSocialIcon(item.key);
                return (
                  <li key={item.id}>
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
            {footerData.copyright.map((item) => (
              <p key={item.id}>{item.value}</p>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
