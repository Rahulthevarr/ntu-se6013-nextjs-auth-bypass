import './globals.css';
export const metadata = { title: 'Middleware Lab Target', robots: { index: false, follow: false } };
export default function Layout({ children }) {
  return <html lang="en"><body><header><strong>Example records app</strong><span>Vulnerable lab target</span></header><main>{children}</main></body></html>;
}
