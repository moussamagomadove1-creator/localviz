import './globals.css';

export const metadata = {
  title: 'LocalViz - Find Local Businesses Without Websites',
  description: 'The ultimate B2B tool for web developers to find, track, and contact local businesses that have zero online presence.',
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
