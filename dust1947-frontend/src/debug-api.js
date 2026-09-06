// Debug: Zeige welche API-URL verwendet wird
console.log('==========================================');
console.log('🔍 API CONFIGURATION DEBUG');
console.log('==========================================');
console.log('REACT_APP_API_BASE:', process.env.REACT_APP_API_BASE);
console.log('REACT_APP_API_KEY:', process.env.REACT_APP_API_KEY ? '***SET***' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('==========================================');

export const debugLog = () => {
  console.log('API Base URL:', process.env.REACT_APP_API_BASE || 'NOT SET - Using default');
};

