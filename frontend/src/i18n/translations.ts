/**
 * Ohara - Internationalization
 * Scholar's Sanctum theme translations
 * Supports: English (en), German (de)
 */

export type Language = 'en' | 'de';

export const translations = {
  en: {
    // General
    connected: "Connected",
    offline: "Offline",
    settings: "Settings",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    rename: "Rename",
    search: "Search...",
    loading: "Loading...",
    
    // Research phases
    researchRunning: "Research in progress...",
    researchError: "Research encountered an issue",
    researchComplete: "Research Complete",
    analyzing: "Analyzing",
    initializing: "Initializing...",
    processing: "Processing...",
    
    // Plan
    planCreated: "**Research Plan prepared:**\n\n",
    planFailed: "Could not prepare research plan.",
    planRevised: "**Research Plan revised (v",
    planRevisedSuffix: "):**\n\n",
    planChangePrompt: "What changes would you like to make to the plan?",
    letsGo: "Begin Research",
    editPlan: "Revise Plan",
    
    // Deep Research
    deepResearchStarted: "**Scholarly Investigation Commenced**\n\nNow researching ",
    finalSynthesisStarting: "**Compiling Final Report**\n\nSynthesizing ",
    researchCompleteStats: "**Investigation Complete**\n\n- ",
    researchErrorPrefix: "**Research Error:**\n\n",
    
    // Progress
    pointSkipped: "Point ",
    skipped: " skipped",
    reason: "Reason:",
    pointCompleted: "Point ",
    completed: " completed",
    sourcesFound: " sources found",
    
    // Sources
    sourcesUsed: "Sources Consulted (",
    hideDossier: "Hide Full Report",
    showFullDossier: "Show Full Report",
    
    // Synthesis
    finalSynthesisRunning: "Compiling final synthesis...",
    restoreSynthesis: "Restore Previous Work",
    loadingLastSynthesis: "Loading last synthesis...",
    synthesisRestored: "**Previous work restored**\n\nSource: `",
    synthesisLoadFailed: "**Could not restore synthesis**\n\n",
    
    // Modes
    normal: "Standard",
    academic: "Academic",
    academicModeActive: "Academic Research Mode active",
    
    // Sidebar
    newResearch: "New Research",
    yourResearches: "Your Archives",
    noResearchesYet: "No archives yet",
    
    // Settings
    settingsTitle: "Settings",
    apiKeyRequired: "API Key required",
    requiredForModelSelection: "Required for model selection",
    modelSelection: "Model Selection",
    loadingModels: "Loading models...",
    workModel: "Work Model",
    workModelHelp: "For analysis (fast + efficient)",
    finalModel: "Synthesis Model",
    finalModelHelp: "For final report (larger = better quality)",
    modelsAvailable: "models available",
    recommended: "Recommended",
    darkMode: "Dark Mode",
    language: "Language",
    provider: "API Provider",
    
    // Input
    startResearch: "Ask anything to begin your research...",
    
    // Chat
    consultingArchives: "Consulting the archives...",
    
    // Timer
    elapsed: "Elapsed",
    
    // Export (future feature)
    noSessionActive: "No session active.",
    exportOnlyWhenDone: "Export only available when research is complete.",
    noExportableMessage: "No exportable content found.",
    exportSuccess: "Export successful!",
    exportFailed: "Export failed: ",
  },

  de: {
    // General
    connected: "Verbunden",
    offline: "Offline",
    settings: "Einstellungen",
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    rename: "Umbenennen",
    search: "Suchen...",
    loading: "Lädt...",
    
    // Research phases
    researchRunning: "Recherche läuft...",
    researchError: "Recherche fehlgeschlagen",
    researchComplete: "Recherche abgeschlossen",
    analyzing: "Analysiere",
    initializing: "Initialisiere...",
    processing: "Verarbeite...",
    
    // Plan
    planCreated: "**Recherche-Plan erstellt:**\n\n",
    planFailed: "Plan konnte nicht erstellt werden.",
    planRevised: "**Recherche-Plan überarbeitet (v",
    planRevisedSuffix: "):**\n\n",
    planChangePrompt: "Was möchtest du am Plan ändern?",
    letsGo: "Los geht's",
    editPlan: "Plan bearbeiten",
    
    // Deep Research
    deepResearchStarted: "**Tiefenrecherche gestartet**\n\nArbeite jetzt an ",
    finalSynthesisStarting: "**Final Synthesis startet**\n\nKombiniere ",
    researchCompleteStats: "**Recherche abgeschlossen**\n\n- ",
    researchErrorPrefix: "**Recherche-Fehler:**\n\n",
    
    // Progress
    pointSkipped: "Punkt ",
    skipped: " übersprungen",
    reason: "Grund:",
    pointCompleted: "Punkt ",
    completed: " abgeschlossen",
    sourcesFound: " Quellen gefunden",
    
    // Sources
    sourcesUsed: "Verwendete Quellen (",
    hideDossier: "Dossier ausblenden",
    showFullDossier: "Vollständiges Dossier anzeigen",
    
    // Synthesis
    finalSynthesisRunning: "Erstelle finale Synthese...",
    restoreSynthesis: "Vorherige Arbeit wiederherstellen",
    loadingLastSynthesis: "Lade letzte Synthese...",
    synthesisRestored: "**Vorherige Arbeit wiederhergestellt**\n\nQuelle: `",
    synthesisLoadFailed: "**Synthese konnte nicht geladen werden**\n\n",
    
    // Modes
    normal: "Standard",
    academic: "Akademisch",
    academicModeActive: "Akademischer Recherche-Modus aktiv",
    
    // Sidebar
    newResearch: "Neue Recherche",
    yourResearches: "Deine Archive",
    noResearchesYet: "Noch keine Archive",
    
    // Settings
    settingsTitle: "Einstellungen",
    apiKeyRequired: "API-Schlüssel erforderlich",
    requiredForModelSelection: "Erforderlich für Modellauswahl",
    modelSelection: "Modellauswahl",
    loadingModels: "Lade Modelle...",
    workModel: "Arbeitsmodell",
    workModelHelp: "Für Analyse (schnell + effizient)",
    finalModel: "Synthese-Modell",
    finalModelHelp: "Für Endbericht (größer = bessere Qualität)",
    modelsAvailable: "Modelle verfügbar",
    recommended: "Empfohlen",
    darkMode: "Dunkelmodus",
    language: "Sprache",
    provider: "API-Anbieter",
    
    // Input
    startResearch: "Stelle eine Frage um deine Recherche zu starten...",
    
    // Chat
    consultingArchives: "Konsultiere die Archive...",
    
    // Timer
    elapsed: "Vergangen",
    
    // Export (future feature)
    noSessionActive: "Keine Sitzung aktiv.",
    exportOnlyWhenDone: "Export nur möglich wenn Recherche abgeschlossen.",
    noExportableMessage: "Keine exportierbaren Inhalte gefunden.",
    exportSuccess: "Export erfolgreich!",
    exportFailed: "Export fehlgeschlagen: ",
  }
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(key: TranslationKey, lang: Language): string {
  return translations[lang][key];
}

// Hook-friendly version for React components
export function useTranslation(lang: Language) {
  return {
    t: (key: TranslationKey) => translations[lang][key],
    lang,
  };
}
