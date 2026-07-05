/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        // Sirve la landing estática (public/index.html) como portada real,
        // sin pasar por el App Router ni el layout de la aplicación.
        { source: "/", destination: "/index.html" },
      ],
    };
  },
};

export default nextConfig;
