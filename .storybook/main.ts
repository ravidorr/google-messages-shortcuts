import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
  stories: ['../design-system/**/*.stories.@(js|ts)'],
  framework: '@storybook/html-vite',
  addons: []
};

export default config;
