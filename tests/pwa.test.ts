import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('DocFrame PWA Installability & Manifest Compliance', () => {
  const publicDir = path.resolve(__dirname, '../public');
  const manifestPath = path.join(publicDir, 'manifest.webmanifest');
  const indexHtmlPath = path.resolve(__dirname, '../index.html');
  const swPath = path.join(publicDir, 'sw.js');

  it('provides a valid and readable manifest.webmanifest file', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content);

    expect(manifest.name).toBe('DocFrame — Document Synthesis & PDF Studio');
    expect(manifest.short_name).toBe('DocFrame');
    expect(manifest.id).toBe('/');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0f172a');
    expect(manifest.background_color).toBe('#ffffff');
    expect(manifest.categories).toContain('productivity');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
  });

  it('ensures all manifest icons physically exist with exact required dimensions', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    for (const icon of manifest.icons) {
      const iconFilename = icon.src.replace(/^\//, '');
      const iconPath = path.join(publicDir, iconFilename);
      expect(fs.existsSync(iconPath), `Icon ${icon.src} must exist in public/`).toBe(true);

      const buf = fs.readFileSync(iconPath);
      // Verify PNG magic bytes
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50);
      expect(buf[2]).toBe(0x4e);
      expect(buf[3]).toBe(0x47);

      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      const [expectedW, expectedH] = icon.sizes.split('x').map(Number);
      
      expect(width).toBe(expectedW);
      expect(height).toBe(expectedH);
    }
  });

  it('includes 192x192, 512x512, and maskable icons', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const any192 = manifest.icons.find((i: { sizes: string; purpose?: string }) => i.sizes === '192x192' && (!i.purpose || i.purpose.includes('any')));
    const any512 = manifest.icons.find((i: { sizes: string; purpose?: string }) => i.sizes === '512x512' && (!i.purpose || i.purpose.includes('any')));
    const maskable = manifest.icons.find((i: { purpose?: string }) => i.purpose && i.purpose.includes('maskable'));

    expect(any192).toBeDefined();
    expect(any512).toBeDefined();
    expect(maskable).toBeDefined();
  });

  it('includes an Apple Touch Icon (180x180) for iOS support', () => {
    const appleIconPath = path.join(publicDir, 'apple-touch-icon.png');
    expect(fs.existsSync(appleIconPath)).toBe(true);
    const buf = fs.readFileSync(appleIconPath);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    expect(width).toBe(180);
    expect(height).toBe(180);
  });

  it('links the manifest and mobile meta tags in index.html', () => {
    const html = fs.readFileSync(indexHtmlPath, 'utf-8');
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest"');
    expect(html).toContain('<meta name="theme-color" content="#0f172a"');
    expect(html).toContain('<meta name="mobile-web-app-capable" content="yes"');
    expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes"');
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png"');
  });

  it('provides a safe service worker that strictly protects APIs and user privacy', () => {
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, 'utf-8');

    // Pre-cache verification
    expect(swContent).toContain("const CACHE_NAME = 'docframe-cache-v1'");
    expect(swContent).toContain("'/manifest.webmanifest'");
    expect(swContent).toContain("'/pwa-192x192.png'");
    expect(swContent).toContain("'/pwa-512x512.png'");

    // Privacy & API bypass guarantees
    expect(swContent).toContain("url.pathname.startsWith('/api/')");
    expect(swContent).toContain("openai.com");
    expect(swContent).toContain("anthropic.com");
    expect(swContent).toContain("googleapis.com");
    expect(swContent).toContain("groq.com");
    expect(swContent).toContain("deepseek.com");
    expect(swContent).toContain("openrouter.ai");
    expect(swContent).toContain("11434"); // Local Ollama
  });
});
