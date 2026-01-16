/**
 * ============================================================================
 * HOOK: useModuleCapabilities
 * ============================================================================
 *
 * Hook que analisa um serviço e retorna suas capacidades detectadas
 */

import { useMemo } from 'react';
import {
  detectModuleCapabilities,
  shouldShowMapTab,
  shouldShowCalendarTab,
  shouldShowGalleryTab,
  shouldShowLinkedCitizensTab,
  type ModuleCapabilities
} from '@/lib/module-intelligence';

export function useModuleCapabilities(service: any) {
  const capabilities = useMemo<ModuleCapabilities>(() => {
    if (!service) {
      return {
        hasGeolocation: false,
        hasScheduling: false,
        hasImages: false,
        hasLinkedCitizens: false,
        hasDocuments: false,
        hasNumericData: false,
        mode: 'GENERICO',
        keyFields: [],
        sensitiveFields: [],
        requiredFields: [],
        dateFields: [],
        locationFields: [],
        imageFields: [],
        recommendedVisualization: 'TABLE',
        supportedVisualizations: ['TABLE'],
        totalFields: 0,
        citizenFieldsCount: 0,
        customFieldsCount: 0,
      };
    }

    return detectModuleCapabilities(service);
  }, [service]);

  const tabs = useMemo(() => ({
    showMap: shouldShowMapTab(capabilities),
    showCalendar: shouldShowCalendarTab(capabilities),
    showGallery: shouldShowGalleryTab(capabilities),
    showLinkedCitizens: shouldShowLinkedCitizensTab(capabilities),
  }), [capabilities]);

  return {
    capabilities,
    tabs,
  };
}
