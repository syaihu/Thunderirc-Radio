// Website Branding Configuration
// Edit these values to customize your radio station

export const BRANDING = {
  // Main Website Name
  siteName: "ThunderIrc Radio",
  
  // Station Tagline/Description
  tagline: "Synthwave & Cyberpunk Vibes",
  
  // Radio Control Panel Title
  controlPanelTitle: "Radio Control Panel",
  
  // Server Information (shown in admin)
  serverInfo: {
    os: "OpenBSD 7.6",
    streamServer: "Icecast Server",
    version: "2.4.4"
  },
  
  // IRC Settings
  irc: {
    defaultChannel: "#thunderirc",
    botName: "StreamBot",
    server: "irc.thunderirc.net"
  },
  
  // Theme Colors (CSS variables)
  colors: {
    primary: "hsl(180, 100%, 50%)", // Cyan
    secondary: "hsl(300, 100%, 50%)", // Magenta
    accent: "hsl(120, 100%, 50%)" // Green
  },
  
  // Station Metadata
  metadata: {
    genre: "Synthwave",
    website: "https://neonwave.radio",
    email: "admin@neonwave.radio",
    maxBitrate: "320 kbps"
  }
};

// Helper function to update document title
export function updatePageTitle(pageTitle?: string) {
  const fullTitle = pageTitle 
    ? `${pageTitle} - ${BRANDING.siteName}` 
    : BRANDING.siteName;
  document.title = fullTitle;
}