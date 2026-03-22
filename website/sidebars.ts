import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guideSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Kom i gang',
      items: ['kom-i-gang/installasjon', 'kom-i-gang/oppsett', 'kom-i-gang/bambu-cloud'],
    },
    {
      type: 'category',
      label: 'Guider',
      items: ['guider/foerste-print', 'guider/filament-oppsett', 'guider/daglig-bruk', 'guider/velge-rett-plate', 'guider/feilsoking-print', 'guider/multi-printer', 'guider/varsler-oppsett', 'guider/paneler', 'guider/backup-restore', 'guider/obs-streaming'],
    },
    {
      type: 'category',
      label: 'Funksjoner',
      items: [
        'funksjoner/oversikt',
        'funksjoner/dashboard',
        'funksjoner/fleet',
        'funksjoner/obs-overlay',
        'funksjoner/queue',
        'funksjoner/notifications',
        'funksjoner/timelapse',
        'funksjoner/gallery',
        'funksjoner/projects',
        'funksjoner/filament',
        'funksjoner/historikk',
        'funksjoner/scheduler',
        'funksjoner/controls',
      ],
    },
    {
      type: 'category',
      label: 'Overvåking',
      items: [
        'overvaaking/protection',
        'overvaaking/errors',
        'overvaaking/diagnostics',
        'overvaaking/maintenance',
        'overvaaking/wearprediction',
        'overvaaking/erroranalysis',
      ],
    },
    {
      type: 'category',
      label: 'Analyse',
      items: [
        'analyse/statistics',
        'analyse/calendar',
        'analyse/filamentanalytics',
        'analyse/costestimator',
        'analyse/waste',
        'analyse/comparison',
      ],
    },
    {
      type: 'category',
      label: 'Verktøy',
      items: [
        'verktoy/labels',
        'verktoy/library',
        'verktoy/profiles',
        'verktoy/playground',
        'verktoy/achievements',
        'verktoy/bedmesh',
      ],
    },
    {
      type: 'category',
      label: 'Integrasjoner',
      items: [
        'integrasjoner/home-assistant',
        'integrasjoner/energy',
        'integrasjoner/power',
        'integrasjoner/remote-nodes',
        'integrasjoner/ecommerce',
        'integrasjoner/community',
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
      items: ['avansert/api', 'avansert/arkitektur', 'avansert/docker', 'avansert/plugins'],
    },
  ],
  kbSidebar: [
    'kb/intro',
    {
      type: 'category',
      label: 'Filamenter',
      items: ['kb/filamenter/pla', 'kb/filamenter/petg', 'kb/filamenter/abs', 'kb/filamenter/tpu', 'kb/filamenter/nylon', 'kb/filamenter/kompositt'],
    },
    {
      type: 'category',
      label: 'Byggplater',
      items: ['kb/byggplater/oversikt', 'kb/byggplater/cool-plate', 'kb/byggplater/engineering-plate', 'kb/byggplater/high-temp-plate', 'kb/byggplater/textured-pei'],
    },
    {
      type: 'category',
      label: 'Vedlikehold',
      items: ['kb/vedlikehold/dyse', 'kb/vedlikehold/plate', 'kb/vedlikehold/ams', 'kb/vedlikehold/smoring'],
    },
    {
      type: 'category',
      label: 'Feilsøking',
      items: ['kb/feilsoking/heft', 'kb/feilsoking/warping', 'kb/feilsoking/stringing'],
    },
  ],
};

export default sidebars;
