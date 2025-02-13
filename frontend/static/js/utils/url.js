export function prettyEncodeURL(value) {
    // Mapping for all reserved/special characters that we want to encode.
    // This includes all characters from RFC 3986's reserved set plus a few extras.
    const conversionMap = {
      ' ': '%20',
      '!': '%21',
      '"': '%22',
      '#': '%23',
      '$': '%24',
      '%': '%25',
      '&': '%26',
      "'": '%27',
      '(': '%28',
      ')': '%29',
      '*': '%2A',
      '+': '%2B',
      ',': '%2C',
      '/': '%2F',
      ':': '%3A',
      ';': '%3B',
      '<': '%3C',
      '=': '%3D',
      '>': '%3E',
      '?': '%3F',
      '@': '%40',
      '[': '%5B',
      '\\': '%5C',
      ']': '%5D',
      '^': '%5E',
      '`': '%60',
      '{': '%7B',
      '|': '%7C',
      '}': '%7D'
    };
  
    let result = "";
  
    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      if (conversionMap.hasOwnProperty(char)) {
        // If the character appears in our map, use the mapped value.
        result += conversionMap[char];
      } else if (/^[A-Za-z0-9\-._~]$/.test(char) || char.charCodeAt(0) > 127) {
        // Unreserved characters (or non-ASCII characters) remain as is.
        result += char;
      } else {
        // Fallback: encode the character using its hexadecimal representation.
        let hex = char.charCodeAt(0).toString(16).toUpperCase();
        if (hex.length < 2) {
           hex = '0' + hex;
        }
        result += '%' + hex;
      }
    }
  
    return result;
}