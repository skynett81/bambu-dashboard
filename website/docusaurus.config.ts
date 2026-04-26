import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: '3DPrintForge',
  tagline: 'Self-hosted dashboard for all 3D printers',
  favicon: 'img/favicon.svg',

  headTags: [
    {
      tagName: 'meta',
      attributes: {
        'http-equiv': 'Content-Security-Policy',
        content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https:;",
      },
    },
  ],

  future: {
    v4: true,
  },

  // For lokal bruk: /docs/ under dashboardet
  // For GitHub Pages: sett DOCUSAURUS_URL og DOCUSAURUS_BASE_URL miljøvariabler
  url: process.env.DOCUSAURUS_URL || 'https://localhost:3443',
  baseUrl: process.env.DOCUSAURUS_BASE_URL || '/docs/',

  organizationName: 'skynett81',
  projectName: '3dprintforge',
  trailingSlash: false,
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'nb',
    locales: ['nb', 'en'],
    localeConfigs: {
      nb: { label: 'Norsk', direction: 'ltr' },
      en: { label: 'English', direction: 'ltr' },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/skynett81/3dprintforge/tree/main/website/',
        },
        blog: {
          showReadingTime: true,
          blogTitle: 'Oppdateringer',
          blogDescription: 'Siste nytt fra 3DPrintForge',
          blogSidebarTitle: 'Siste innlegg',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '3DPrintForge',
      logo: {
        alt: '3DPrintForge',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'guideSidebar',
          position: 'left',
          label: 'Dokumentasjon',
        },
        {
          type: 'docSidebar',
          sidebarId: 'kbSidebar',
          position: 'left',
          label: 'Kunnskapsbase',
        },
        {to: '/blog', label: 'Oppdateringer', position: 'left'},
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://localhost:3443',
          label: '← Dashboard',
          position: 'right',
        },
        {
          href: 'https://github.com/skynett81/3dprintforge',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://ko-fi.com/V7V21NRKM7',
          label: '☕ Ko-fi',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Dokumentasjon',
          items: [
            { label: 'Kom i gang', to: '/getting-started/installation' },
            { label: 'Funksjoner', to: '/features/overview' },
            { label: 'API-referanse', to: '/advanced/api' },
          ],
        },
        {
          title: 'Kunnskapsbase',
          items: [
            { label: 'Filamenter', to: '/kb/filaments/pla' },
            { label: 'Byggplater', to: '/kb/build-plates/overview' },
            { label: 'Vedlikehold', to: '/kb/maintenance/nozzle' },
          ],
        },
        {
          title: 'Lenker',
          items: [
            { label: 'Dashboard', href: 'https://localhost:3443' },
            { label: 'GitHub', href: 'https://github.com/skynett81/3dprintforge' },
            { label: 'MakerWorld', href: 'https://makerworld.com' },
            { label: '☕ Support on Ko-fi', href: 'https://ko-fi.com/V7V21NRKM7' },
          ],
        },
      ],
      copyright: `3DPrintForge v1.1.20 — ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'docker'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
