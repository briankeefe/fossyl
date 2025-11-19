// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'fossyl',
      description: 'Type-safe REST API framework with compile-time guarantees',
      favicon: '/favicon.svg',
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            href: '/favicon.svg',
            type: 'image/svg+xml',
          },
        },
      ],
      expressiveCode: {
        defaultProps: {
          frame: 'none',
        },
        themes: [{
          type: 'dark',
          name: 'fossyl-theme',
          colors: {
            'editor.background': '#3d2a0d',
            'editor.foreground': '#f8e8d6',
          },
          tokenColors: [
            {
              scope: ['comment', 'punctuation.definition.comment'],
              settings: {
                foreground: '#a08060',
                fontStyle: 'italic',
              },
            },
            {
              scope: ['keyword', 'storage.type', 'storage.modifier'],
              settings: {
                foreground: '#F5583A',
              },
            },
            {
              scope: ['string', 'string.quoted'],
              settings: {
                foreground: '#A3B18A',
              },
            },
            {
              scope: ['entity.name.function', 'support.function'],
              settings: {
                foreground: '#ee7508',
              },
            },
            {
              scope: ['variable', 'variable.other', 'variable.parameter'],
              settings: {
                foreground: '#E3BC8E',
              },
            },
            {
              scope: [
                'variable.object.property',
                'variable.other.property',
                'variable.other.object.property',
                'meta.object-literal.key',
                'entity.name.tag',
                'support.variable.property',
                'meta.property.object',
              ],
              settings: {
                foreground: '#E8C547',
              },
            },
            {
              scope: ['constant', 'constant.numeric'],
              settings: {
                foreground: '#ee7508',
              },
            },
            {
              scope: ['constant.language.boolean', 'constant.language.null', 'constant.language.undefined'],
              settings: {
                foreground: '#A3B18A',
              },
            },
            {
              scope: ['entity.name.type', 'support.type', 'support.class'],
              settings: {
                foreground: '#da8825',
              },
            },
          ],
        }],
        styleOverrides: {
          borderRadius: '0',
          borderWidth: '6px',
          borderColor: '#6d4204',
          frames: {
            shadowColor: 'transparent',
          },
        },
      },
      social: [
        {
          label: 'GitHub',
          icon: 'github',
          href: 'https://github.com/gHashTag/fossyl',
        },
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'Introduction', link: '/' },
            { label: 'Getting Started', slug: 'getting-started' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API Reference', slug: 'api-reference' },
          ],
        },
      ],
      customCss: [
        './src/styles/index.css',
      ],
      components: {
        ThemeProvider: './src/components/ThemeProvider.astro',
      },
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
      },
    }),
  ],
  site: 'https://fossyl.dev',
});
