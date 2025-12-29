const { contextBridge, ipcRenderer } = require('electron')

const icons = {
  trash: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `.trim(),
  dragHandle: `
    <svg fill="currentColor" width="24" height="24" viewBox="0 0 36 36" version="1.1"  preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="12" r="1.5" class="clr-i-outline clr-i-outline-path-1"></circle><circle cx="15" cy="24" r="1.5" class="clr-i-outline clr-i-outline-path-2"></circle><circle cx="21" cy="12" r="1.5" class="clr-i-outline clr-i-outline-path-3"></circle><circle cx="21" cy="24" r="1.5" class="clr-i-outline clr-i-outline-path-4"></circle><circle cx="21" cy="18" r="1.5" class="clr-i-outline clr-i-outline-path-5"></circle><circle cx="15" cy="18" r="1.5" class="clr-i-outline clr-i-outline-path-6"></circle>
        <rect x="0" y="0" width="24" height="24" fill-opacity="0"/>
    </svg>
  `.trim(),
  addText: `
    <svg fill="currentColor" width="24" height="24" viewBox="0 0 36 36" version="1.1"  preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <path class="clr-i-outline clr-i-outline-path-1" d="M31,21H13a1,1,0,0,0,0,2H31a1,1,0,0,0,0-2Z"></path><path class="clr-i-outline clr-i-outline-path-2" d="M12,16a1,1,0,0,0,1,1H31a1,1,0,0,0,0-2H13A1,1,0,0,0,12,16Z"></path><path class="clr-i-outline clr-i-outline-path-3" d="M27,27H13a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"></path><path class="clr-i-outline clr-i-outline-path-4" d="M15.89,9a1,1,0,0,0-1-1H10V3.21a1,1,0,0,0-2,0V8H2.89a1,1,0,0,0,0,2H8v5.21a1,1,0,0,0,2,0V10h4.89A1,1,0,0,0,15.89,9Z"></path>
        <rect x="0" y="0" width="36" height="36" fill-opacity="0"/>
    </svg>
  `.trim(),
  addStave: `
    <svg fill="currentColor" width="24" height="24" viewBox="0 0 36 36" version="1.1"  preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <path class="clr-i-outline clr-i-outline-path-1" d="M 31,27 H 13 a 1,1 0 0 0 0,2 h 18 a 1,1 0 0 0 0,-2 z" id="path5" /><path class="clr-i-outline clr-i-outline-path-1"d="M31,21H13a1,1,0,0,0,0,2H31a1,1,0,0,0,0-2Z"id="path1" /><path class="clr-i-outline clr-i-outline-path-2" d="M12,16a1,1,0,0,0,1,1H31a1,1,0,0,0,0-2H13A1,1,0,0,0,12,16Z" id="path2" /><path class="clr-i-outline clr-i-outline-path-1" d="M 13.988848,28.003346 V 16.085874 a 1,0.66208179 0 0 0 -2,0 v 11.917472 a 1,0.66208179 0 0 0 2,0 z" id="path6" /><path class="clr-i-outline clr-i-outline-path-4" d="M15.89,9a1,1,0,0,0-1-1H10V3.21a1,1,0,0,0-2,0V8H2.89a1,1,0,0,0,0,2H8v5.21a1,1,0,0,0,2,0V10h4.89A1,1,0,0,0,15.89,9Z" id="path4" /><path class="clr-i-outline clr-i-outline-path-1" d="M 32.000356,28.003346 V 16.085874 a 1,0.66208179 0 0 0 -2,0 v 11.917472 a 1,0.66208179 0 0 0 2,0 z" id="path7" /><path class="clr-i-outline clr-i-outline-path-1" d="M 19.966398,28.003346 V 16.085874 a 1,0.66208179 0 0 0 -2,0 v 11.917472 a 1,0.66208179 0 0 0 2,0 z" id="path8" /><path class="clr-i-outline clr-i-outline-path-1" d="M 25.959719,28.003346 V 16.085874 a 1,0.66208179 0 0 0 -2,0 v 11.917472 a 1,0.66208179 0 0 0 2,0 z" id="path9" />
      <rect x="0" y="0" width="36" height="36" fill-opacity="0" id="rect4" />
    </svg>
  `.trim(),
  saveFile: `
    <svg fill="currentColor" width="24" height="24" viewBox="0 0 36 36" version="1.1"  preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <path class="clr-i-outline clr-i-outline-path-1" d="M31,31H5a1,1,0,0,0,0,2H31a1,1,0,0,0,0-2Z"></path><path class="clr-i-outline clr-i-outline-path-2" d="M18,29.48,28.61,18.87a1,1,0,0,0-1.41-1.41L19,25.65V5a1,1,0,0,0-2,0V25.65L8.81,17.46a1,1,0,1,0-1.41,1.41Z"></path>
        <rect x="0" y="0" width="36" height="36" fill-opacity="0"/>
    </svg>
  `.trim(),
  collapse: `
    <svg fill="currentColor" width="24" height="24" viewBox="0 0 36 36" version="1.1"  preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <path class="clr-i-outline clr-i-outline-path-1" d="M29,19.41a1,1,0,0,1-.71-.29L18,8.83,7.71,19.12a1,1,0,0,1-1.41-1.41L18,6,29.71,17.71A1,1,0,0,1,29,19.41Z"></path><path class="clr-i-outline clr-i-outline-path-2" d="M29,30.41a1,1,0,0,1-.71-.29L18,19.83,7.71,30.12a1,1,0,0,1-1.41-1.41L18,17,29.71,28.71A1,1,0,0,1,29,30.41Z"></path>
        <rect x="0" y="0" width="36" height="36" fill-opacity="0"/>
    </svg>
  `.trim(),
  addTabArticulation: `
    <svg fill="currentColor" width="100%" height="100%" viewBox="0 0 36 36" version="1.1"  preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <path class="clr-i-outline clr-i-outline-path-1" d="M31,21H13a1,1,0,0,0,0,2H31a1,1,0,0,0,0-2Z"></path><path class="clr-i-outline clr-i-outline-path-2" d="M12,16a1,1,0,0,0,1,1H31a1,1,0,0,0,0-2H13A1,1,0,0,0,12,16Z"></path><path class="clr-i-outline clr-i-outline-path-3" d="M27,27H13a1,1,0,0,0,0,2H27a1,1,0,0,0,0-2Z"></path><path class="clr-i-outline clr-i-outline-path-4" d="M15.89,9a1,1,0,0,0-1-1H10V3.21a1,1,0,0,0-2,0V8H2.89a1,1,0,0,0,0,2H8v5.21a1,1,0,0,0,2,0V10h4.89A1,1,0,0,0,15.89,9Z"></path>
        <rect x="0" y="0" width="36" height="36" fill-opacity="0"/>
    </svg>
  `.trim(),
  plectrmLogo: `
    <svg fill="currentColor" width="100%" height="100%" viewBox="0 0 2000 2000" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g transform="matrix(1,0,0,1,-86.742342,-74.999932)">
            <path d="M761.061,1688.79C581.107,1425.141 432.722,991.07 453.655,794.894C496.551,392.887 921.922,318.148 1152.492,278.836C1365.898,266.493 1819.146,237.971 1805.962,668.181C1795.591,1006.615 1311.616,1891.882 1037.369,1905.413C987.259,1907.885 934.163,1880.372 881.203,1832.125L881.203,1382.58C887.043,1234.252 1009.136,1115.794 1158.896,1115.794L1279.361,1115.794C1432.548,1115.794 1556.731,991.611 1556.731,838.423C1556.731,684.005 1431.551,558.825 1277.133,558.825L936.244,558.825C889.783,558.825 845.224,577.281 812.371,610.135C779.517,642.988 761.061,687.547 761.061,734.008L761.061,1688.79Z"/>
        </g>
    </svg>
  `.trim(),
  importProject: `
    <svg fill="currentColor" width="100%" height="100%" viewBox="0 0 36 36" version="1.1"  preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <path d="M28,4H14.87L8,10.86V15h2V13.61h7.61V6H28V30H8a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V6A2,2,0,0,0,28,4ZM16,12H10v-.32L15.7,6H16Z" class="clr-i-outline clr-i-outline-path-1"></path><path d="M11.94,26.28a1,1,0,1,0,1.41,1.41L19,22l-5.68-5.68a1,1,0,0,0-1.41,1.41L15.2,21H3a1,1,0,1,0,0,2H15.23Z" class="clr-i-outline clr-i-outline-path-2"></path>
      <rect x="0" y="0" width="36" height="36" fill-opacity="0"/>
    </svg>`.trim(),
  projectFile: `
    <svg fill="currentColor" width="100%" height="100%" viewBox="0 0 36 36" version="1.1"  preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <path class="clr-i-outline clr-i-outline-path-1" d="M21.89,4H7.83A1.88,1.88,0,0,0,6,5.91V30.09A1.88,1.88,0,0,0,7.83,32H28.17A1.88,1.88,0,0,0,30,30.09V11.92Zm-.3,2.49,6,5.9h-6ZM8,30V6H20v8h8V30Z"></path>
      <rect x="0" y="0" width="36" height="36" fill-opacity="0"/>
    </svg>`.trim(),
  addNotation: `
    <svg fill="currentColor" width="800" height="800" version="1.2" viewBox="0 0 800 800" version="1.2" xmlns="http://www.w3.org/2000/svg"  >
	<g id="Layer 1">
		<g id="Folder 1">
			<path d="m729.88 456.26h-443.25c-6.54 0-12.8 2.59-17.42 7.21-4.62 4.62-7.21 10.88-7.21 17.41 0 6.53 2.59 12.8 7.21 17.41 4.62 4.62 10.88 7.22 17.42 7.22h443.25c6.53 0 12.79-2.6 17.41-7.22 4.62-4.61 7.21-10.88 7.21-17.41 0-6.53-2.59-12.79-7.21-17.41-4.62-4.62-10.88-7.21-17.41-7.21z"/>
			<path d="m509.73 727.5c3.23 0 6.43-0.64 9.42-1.87 2.99-1.24 5.7-3.06 7.99-5.34 2.29-2.29 4.1-5 5.34-7.99 1.24-2.99 1.87-6.19 1.87-9.42v-443.25c0-6.54-2.59-12.8-7.21-17.42-4.62-4.62-10.88-7.21-17.41-7.21-6.53 0-12.8 2.59-17.42 7.21-4.61 4.62-7.21 10.88-7.21 17.42v443.25c0 3.23 0.64 6.43 1.88 9.42 1.23 2.99 3.05 5.7 5.33 7.99 2.29 2.28 5.01 4.1 7.99 5.34 2.99 1.23 6.19 1.87 9.43 1.87z"/>
			<path id="Layer copy" d="m333.02 656.14c2.28 2.19 5 3.91 7.99 5.07 2.98 1.15 6.19 1.71 9.42 1.64 3.23-0.07 6.44-0.76 9.42-2.03 2.99-1.27 5.71-3.1 7.99-5.39l313.43-313.43c4.62-4.61 7.21-10.8 7.21-17.2 0-6.4-2.59-12.48-7.21-16.91-4.62-4.43-10.88-6.84-17.42-6.71-6.53 0.13-12.79 2.8-17.41 7.42l-313.42 313.43c-2.29 2.28-4.1 4.98-5.34 7.93-1.24 2.95-1.88 6.1-1.88 9.27 0 3.17 0.64 6.29 1.88 9.19 1.24 2.91 3.05 5.53 5.34 7.72z"/>
			<path id="Layer copy 2" d="m328.58 304.57c-2.19 2.28-3.91 5-5.06 7.98-1.15 2.99-1.71 6.19-1.64 9.43 0.06 3.23 0.75 6.43 2.02 9.42 1.28 2.99 3.11 5.7 5.4 7.99l313.42 313.43c4.62 4.61 10.81 7.21 17.21 7.21 6.39 0 12.48-2.6 16.9-7.21 4.43-4.62 6.85-10.89 6.71-17.42-0.13-6.53-2.8-12.79-7.42-17.41l-313.42-313.42c-2.29-2.29-4.99-4.1-7.94-5.34-2.95-1.24-6.1-1.88-9.27-1.88-3.16 0-6.29 0.64-9.19 1.88-2.9 1.24-5.52 3.05-7.72 5.34z"/>
		</g>
		<path d="m353.11 200c0-2.92-0.57-5.81-1.69-8.5-1.12-2.7-2.75-5.15-4.82-7.21-2.06-2.07-4.51-3.7-7.21-4.82-2.69-1.12-5.58-1.69-8.5-1.69h-108.67v-106.45c0-5.89-2.34-11.54-6.51-15.71-4.16-4.17-9.82-6.51-15.71-6.51-5.89 0-11.55 2.34-15.71 6.51-4.17 4.17-6.51 9.82-6.51 15.71v106.45h-113.56c-5.89 0-11.54 2.34-15.71 6.51-4.17 4.16-6.51 9.82-6.51 15.71 0 5.89 2.34 11.55 6.51 15.71 4.17 4.17 9.82 6.51 15.71 6.51h113.56v115.78c0 5.89 2.34 11.55 6.51 15.71 4.16 4.17 9.82 6.51 15.71 6.51 5.89 0 11.55-2.34 15.71-6.51 4.17-4.16 6.51-9.82 6.51-15.71v-115.78h108.67c2.92 0 5.81-0.57 8.5-1.69 2.7-1.12 5.15-2.75 7.21-4.82 2.07-2.06 3.7-4.51 4.82-7.21 1.12-2.69 1.69-5.58 1.69-8.5z"/>
	</g>
</svg>`.trim()
  };


contextBridge.exposeInMainWorld('electronAPI', {
  getIcon: (name) => {
    return icons[name] || null;
  },
  saveTextAsFile: (content, defaultFilename) => {
    return ipcRenderer.invoke('dialog:save-text-file', content, defaultFilename);
  },
  importFile: () => {
    return ipcRenderer.invoke('dialog:import-file');
  }
});