import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guideSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Kom i gang',
      items: ['getting-started/installation', 'getting-started/setup', 'getting-started/bambu-cloud'],
    },
    {
      type: 'category',
      label: 'Guider',
      items: ['guides/first-print', 'guides/filament-setup', 'guides/daily-use', 'guides/choosing-plate', 'guides/print-troubleshooting', 'guides/multi-printer', 'guides/notification-setup', 'guides/panels', 'guides/backup-restore', 'guides/obs-streaming', 'guides/product-pricing'],
    },
    {
      type: 'category',
      label: 'Funksjoner',
      items: [
        'features/overview',
        'features/dashboard',
        'features/fleet',
        'features/obs-overlay',
        'features/queue',
        'features/notifications',
        'features/timelapse',
        'features/gallery',
        'features/projects',
        'features/filament',
        'features/history',
        'features/scheduler',
        'features/controls',
      ],
    },
    {
      type: 'category',
      label: 'Overvåking',
      items: [
        'monitoring/protection',
        'monitoring/errors',
        'monitoring/diagnostics',
        'monitoring/maintenance',
        'monitoring/wearprediction',
        'monitoring/erroranalysis',
      ],
    },
    {
      type: 'category',
      label: 'Analyse',
      items: [
        'analytics/statistics',
        'analytics/calendar',
        'analytics/filamentanalytics',
        'analytics/costestimator',
        'analytics/waste',
        'analytics/comparison',
      ],
    },
    {
      type: 'category',
      label: 'Verktøy',
      items: [
        'tools/model-forge',
        'tools/labels',
        'tools/library',
        'tools/profiles',
        'tools/playground',
        'tools/achievements',
        'tools/bedmesh',
      ],
    },
    {
      type: 'category',
      label: 'Integrasjoner',
      items: [
        'integrations/home-assistant',
        'integrations/energy',
        'integrations/power',
        'integrations/remote-nodes',
        'integrations/ecommerce',
        'integrations/community',
      ],
    },
    {
      type: 'category',
      label: 'System',
      items: [
        'system/auth',
        'system/backup',
        'system/settings',
        'system/themes',
        'system/pwa',
        'system/kiosk',
        'system/reports',
        'system/logs',
      ],
    },
    {
      type: 'category',
      label: 'Avansert',
      items: ['advanced/api', 'advanced/architecture', 'advanced/docker', 'advanced/plugins', 'advanced/changelog'],
    },
  ],
  kbSidebar: [
    'kb/intro',
    {
      type: 'category',
      label: 'Filamenter',
      items: ['kb/filaments/pla', 'kb/filaments/petg', 'kb/filaments/abs', 'kb/filaments/tpu', 'kb/filaments/nylon', 'kb/filaments/composite', 'kb/filaments/special', 'kb/filaments/profiles', 'kb/filaments/comparison'],
    },
    {
      type: 'category',
      label: 'Byggplater',
      items: ['kb/build-plates/overview', 'kb/build-plates/cool-plate', 'kb/build-plates/engineering-plate', 'kb/build-plates/high-temp-plate', 'kb/build-plates/textured-pei', 'kb/build-plates/special-plates'],
    },
    {
      type: 'category',
      label: 'Vedlikehold',
      items: ['kb/maintenance/nozzle', 'kb/maintenance/plate', 'kb/maintenance/ams', 'kb/maintenance/lubrication', 'kb/maintenance/drying'],
    },
    {
      type: 'category',
      label: 'Feilsøking',
      items: ['kb/troubleshooting/adhesion', 'kb/troubleshooting/warping', 'kb/troubleshooting/stringing', 'kb/troubleshooting/surface'],
    },
  ],
};

export default sidebars;
