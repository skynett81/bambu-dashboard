import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Bambu Dashboard',
  tagline: '3D-printer dashboard for Bambu Lab printere',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://localhost:3443',
  baseUrl: '/docs/',

  organizationName: 'skynett81',
  projectName: 'bambu-dashboard',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'nb',
    locales: ['nb', 'en', 'de', 'fr', 'es', 'sv', 'cs', 'hu', 'it', 'ja', 'ko', 'nl', 'pl', 'pt-BR', 'tr', 'uk', 'zh-Hans'],
    localeConfigs: {
      nb: { label: 'Norsk', direction: 'ltr' },
      en: { label: 'English', direction: 'ltr' },
      de: { label: 'Deutsch', direction: 'ltr' },
      fr: { label: 'Français', direction: 'ltr' },
      es: { label: 'Español', direction: 'ltr' },
      sv: { label: 'Svenska', direction: 'ltr' },
      cs: { label: 'Čeština', direction: 'ltr' },
      hu: { label: 'Magyar', direction: 'ltr' },
      it: { label: 'Italiano', direction: 'ltr' },
      ja: { label: '日本語', direction: 'ltr' },
      ko: { label: '한국어', direction: 'ltr' },
      nl: { label: 'Nederlands', direction: 'ltr' },
      pl: { label: 'Polski', direction: 'ltr' },
      'pt-BR': { label: 'Português (Brasil)', direction: 'ltr' },
      tr: { label: 'Türkçe', direction: 'ltr' },
      uk: { label: 'Українська', direction: 'ltr' },
      'zh-Hans': { label: '中文（简体）', direction: 'ltr' },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/skynett81/bambu-dashboard/tree/main/website/',
        },
        blog: {
          showReadingTime: true,
          blogTitle: 'Oppdateringer',
          blogDescription: 'Siste nytt fra Bambu Dashboard',
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
      title: 'Bambu Dashboard',
      logo: {
        alt: 'Bambu Dashboard',
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
          href: 'https://github.com/skynett81/bambu-dashboard',
          label: 'GitHub',
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
            { label: 'Kom i gang', to: '/kom-i-gang' },
            { label: 'Funksjoner', to: '/funksjoner' },
            { label: 'API-referanse', to: '/api' },
          ],
        },
        {
          title: 'Kunnskapsbase',
          items: [
            { label: 'Filamenter', to: '/kb/filamenter' },
            { label: 'Byggplater', to: '/kb/byggplater' },
            { label: 'Vedlikehold', to: '/kb/vedlikehold' },
          ],
        },
        {
          title: 'Lenker',
          items: [
            { label: 'Dashboard', href: 'https://localhost:3443' },
            { label: 'GitHub', href: 'https://github.com/skynett81/bambu-dashboard' },
            { label: 'MakerWorld', href: 'https://makerworld.com' },
          ],
        },
      ],
      copyright: `Bambu Dashboard v1.1.11 — ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'docker'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
