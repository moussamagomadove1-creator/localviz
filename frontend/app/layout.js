import './globals.css';

export const metadata = {
  title: 'NoSite - Find Local Businesses Without Websites',
  description: 'The ultimate B2B tool for web developers to find, track, and contact local businesses that have zero online presence.',
  icons: {
    icon: '/SaasLogo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
