import React from 'react';
import { SettingsProvider } from '@/components/SettingsContext';

export default function Layout({ children, currentPageName }) {
  return (
    <SettingsProvider>
      {children}
    </SettingsProvider>
  );
}