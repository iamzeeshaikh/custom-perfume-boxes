// Central site config, contact info, and navigation (preserved from source site).
export const SITE_URL =
  import.meta.env.PUBLIC_SITE_URL || 'https://customperfumeboxes.com';

export const BRAND = {
  name: 'Custom Perfume Boxes',
  short: 'CPB',
  email: 'info@customperfumeboxes.com',
  phone: '(503) 358-0443',
  phoneHref: '+15033580443',
  address: '409 N 7th Ave Unit #529 Phoenix, AZ 85013',
  hours: '24/7',
  facebook: 'https://www.facebook.com/',
  linkedin: 'https://www.linkedin.com/',
};

// Primary navigation — maps to real product categories (preserved from original menu).
export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Color & Design Specific Boxes', href: '/product-category/color-design-specific-boxes/' },
  { label: 'Material Specific Boxes', href: '/product-category/material-specific-boxes/' },
  { label: 'Subscription & Sample Boxes', href: '/product-category/subscription-sample-boxes/' },
  { label: 'Luxury & Specialty Boxes', href: '/product-category/luxury-specialty-boxes/' },
];

// Footer category column (preserved from original footer "BOX CATEGORIES").
export const FOOTER_CATEGORIES = [
  { label: 'Luxury & Specialty Boxes', href: '/product-category/luxury-specialty-boxes/' },
  { label: 'Gift & Collection Boxes', href: '/product-category/gift-collection-boxes/' },
  { label: 'Packaging Boxes', href: '/product-category/packaging-boxes/' },
  { label: 'Miscellaneous Boxes', href: '/product-category/miscellaneous-boxes/' },
  { label: 'Empty Boxes', href: '/product-category/empty-boxes/' },
];

export const FOOTER_COMPANY = [
  { label: 'About Us', href: '/about-us/' },
  { label: 'Contact Us', href: '/contact-us/' },
  { label: 'Privacy Policy', href: '/privacy-policy/' },
  { label: 'Refund and Returns Policy', href: '/refund_returns/' },
  { label: 'Terms & Conditions', href: '/terms-conditions/' },
  { label: 'Shipping Policy', href: '/shipping-policy/' },
];

export const BENEFITS = [
  { icon: 'sizes', label: 'Custom Sizes & Styles' },
  { icon: 'support', label: 'Online 24/7 Support Team' },
  { icon: 'ship', label: 'Free Design Support & Shipping' },
  { icon: 'print', label: 'High Quality Offset Printing' },
  { icon: 'nodie', label: 'No Die & Plate Charges' },
  { icon: 'price', label: 'Best & Competitive Price' },
];
