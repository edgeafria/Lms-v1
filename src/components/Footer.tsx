import React from "react";
import { Link } from "react-router-dom"; 
import {
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Send,
  ExternalLink // Icon to show user they are leaving the site
} from "lucide-react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // 🌍 EXTERNAL LINKS CONFIG
  const LINKS = {
    about: "https://edgesafrica.org/about",
    blog: "https://edgesafrica.org/blog/",
    career: "https://edgesafrica.org/activities-events/",
    help: "https://edgesafrica.org/contact-us/",
    // Socials (Update these when you have them)
    instagram: "https://www.instagram.com/edges_africa?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    linkedin: "https://www.linkedin.com/company/edges-africa/",
    facebook: "#", // Unclickable
    twitter: "#",  // Unclickable
    youtube: "#",  // Unclickable
  };

  return (
    <footer className="bg-primary-500 text-white font-body border-t border-primary-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* 1. BRAND INFO */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 group">
            {/* 🖼️ LOGO IMAGE */}
            <img 
              src="/logo-white.png" 
              alt="Edges Africa" 
              // We use h-10 (40px) or h-12 (48px) depending on how big you want it
              className="h-10 w-auto object-contain"
              width="130" 
              height="40"
              loading="eager" // Important for LCP speed!
            />
          </Link>

            <p className="text-primary-100 font-body mt-5 mb-6 leading-relaxed text-sm">
              EDGES Africa is a pan-African social enterprise helping people
              thrive in a climate-resilient, tech-enabled future.
            </p>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-secondary-500" />
                <a href="mailto:hello@edgesafrica.com" className="text-primary-100 text-sm hover:text-white transition-colors">
                  hello@edgesafrica.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-secondary-500" />
                <span className="text-primary-100 text-sm">Lagos, Nigeria</span>
              </div>
            </div>
          </div>

          {/* 2. QUICK LINKS (Mixed Internal & External) */}
          <div>
            <h3 className="text-lg font-headline font-bold text-secondary-500 mb-6">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {/* Internal */}
              <FooterLink to="/courses" label="Browse Courses" />
              <FooterLink to="/instructors" label="Our Instructors" />
              
              {/* External */}
              <ExternalFooterLink href={LINKS.about} label="About Us" />
              <ExternalFooterLink href={LINKS.career} label="Careers & Events" />
              <ExternalFooterLink href={LINKS.blog} label="Blog & News" />
              <ExternalFooterLink href={LINKS.help} label="Help & Contact" />
            </ul>
          </div>

          {/* 3. POPULAR CATEGORIES (Updated to use Slugs) */}
          <div>
            <h3 className="text-lg font-headline font-bold text-secondary-500 mb-6">
              Popular Categories
            </h3>
            <ul className="space-y-3">
              {/* 👇 BUG FIX: 
                 Changed "Web Development" to "web-development"
                 Changed "Mobile Development" to "mobile-development"
                 etc...
              */}
              <FooterLink to="/courses?category=web-development" label="Web Development" />
              <FooterLink to="/courses?category=mobile-development" label="Mobile Development" />
              <FooterLink to="/courses?category=data-science" label="Data Science" />
              <FooterLink to="/courses?category=digital-marketing" label="Digital Marketing" />
              <FooterLink to="/courses?category=business" label="Business" />
              <FooterLink to="/courses?category=design" label="Design" />
            </ul>
          </div>

          {/* 4. NEWSLETTER */}
          <div>
            <h3 className="text-lg font-headline font-bold text-secondary-500 mb-6">
              Stay Updated
            </h3>
            <p className="text-primary-100 text-sm font-body mb-4">
              Get the latest courses, tips, and news delivered to your inbox.
            </p>

            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-primary-600 border border-primary-400 rounded-lg text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 bg-secondary-500 hover:bg-white text-primary-900 hover:text-primary-600 p-2 rounded-md transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>

            <div className="mt-8">
              <div className="flex space-x-3">
                <SocialIcon href={LINKS.instagram} icon={<Instagram size={18} />} />
                <SocialIcon href={LINKS.linkedin} icon={<Linkedin size={18} />} />
                
                {/* Unclickable / Placeholder Icons */}
                <SocialIcon href={LINKS.facebook} icon={<Facebook size={18} />} />
                <SocialIcon href={LINKS.twitter} icon={<Twitter size={18} />} />
                <SocialIcon href={LINKS.youtube} icon={<Youtube size={18} />} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-primary-600 bg-primary-600/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-200 font-body text-sm">
              © {currentYear} Edges Africa. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-primary-200 hover:text-secondary-500 text-xs transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-primary-200 hover:text-secondary-500 text-xs transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- HELPER COMPONENTS ---

// 1. Internal Link (Uses React Router)
const FooterLink = ({ to, label }: { to: string; label: string }) => (
  <li>
    <Link
      to={to}
      className="text-primary-100 hover:text-secondary-500 hover:translate-x-1 transition-all duration-200 inline-block text-sm"
    >
      {label}
    </Link>
  </li>
);

// 2. External Link (Uses standard <a> tag with security attributes)
const ExternalFooterLink = ({ href, label }: { href: string; label: string }) => (
  <li>
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-100 hover:text-secondary-500 hover:translate-x-1 transition-all duration-200 inline-flex items-center gap-1 text-sm"
    >
      {label} <ExternalLink size={12} className="opacity-70" />
    </a>
  </li>
);

// 3. Social Icon
const SocialIcon = ({ href, icon }: { href: string; icon: React.ReactNode }) => {
  const isClickable = href !== "#";

  return (
    <a
      href={isClickable ? href : undefined}
      target={isClickable ? "_blank" : undefined}
      rel={isClickable ? "noreferrer" : undefined}
      onClick={(e) => !isClickable && e.preventDefault()} // Stop click
      className={`p-2 rounded-lg transition-all duration-300 text-white flex items-center justify-center ${
        isClickable 
          ? "bg-primary-600 hover:bg-secondary-500 hover:text-primary-900 transform hover:-translate-y-1" 
          : "bg-primary-600/50 cursor-not-allowed opacity-50" // Grayed out style
      }`}
    >
      {icon}
    </a>
  );
};

export default Footer;