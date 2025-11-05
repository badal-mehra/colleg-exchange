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

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {footerData.quickLinks.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.link_url || '#'}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.value}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Feedback Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Support & Feedback</h3>
            <ul className="space-y-3">
              {footerData.support.map((item) => (
                <li key={item.id}>
                  {item.link_url ? (
                    <Link
                      to={item.link_url}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors block"
                    >
                      {item.value}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Connect With Us Column */}
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
