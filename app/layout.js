
import "./globals.css";

export const metadata = {
  title: "My Todo App",
  description: "Personal task management application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
