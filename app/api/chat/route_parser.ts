// Parser do wykrywania wywołań funkcji w tekście
// Zwraca: { toolCall: object, textBefore: string, textAfter: string }
export function parseTextToolCall(text: string): { toolCall: any, textBefore: string, textAfter: string } | null {
  
  // Wzorce do wykrywania - obsługują różne formaty
  const patterns = [
    { regex: /computer_use\s*\(\s*["']screenshot["']\s*\)/i, action: "screenshot", hasCoords: false, hasText: false, hasScroll: false },
    { regex: /computer_use\s*\(\s*["']left_click["']\s*,\s*\[?\s*(\d+)\s*,\s*(\d+)\s*\]?\s*\)/i, action: "left_click", hasCoords: true, hasText: false, hasScroll: false },
    { regex: /computer_use\s*\(\s*["']double_click["']\s*,\s*\[?\s*(\d+)\s*,\s*(\d+)\s*\]?\s*\)/i, action: "double_click", hasCoords: true, hasText: false, hasScroll: false },
    { regex: /computer_use\s*\(\s*["']right_click["']\s*,\s*\[?\s*(\d+)\s*,\s*(\d+)\s*\]?\s*\)/i, action: "right_click", hasCoords: true, hasText: false, hasScroll: false },
    { regex: /computer_use\s*\(\s*["']mouse_move["']\s*,\s*\[?\s*(\d+)\s*,\s*(\d+)\s*\]?\s*\)/i, action: "mouse_move", hasCoords: true, hasText: false, hasScroll: false },
    { regex: /computer_use\s*\(\s*["']type["']\s*,\s*["']([^"']+)["']\s*\)/i, action: "type", hasCoords: false, hasText: true, hasScroll: false },
    { regex: /computer_use\s*\(\s*["']key["']\s*,\s*["']([^"']+)["']\s*\)/i, action: "key", hasCoords: false, hasText: true, hasScroll: false },
    { regex: /computer_use\s*\(\s*["']wait["']\s*\)/i, action: "wait", hasCoords: false, hasText: false, hasScroll: false },
    { regex: /computer_use\s*\(\s*["']scroll["']\s*,\s*["'](up|down)["']\s*(?:,\s*(\d+))?\s*\)/i, action: "scroll", hasCoords: false, hasText: false, hasScroll: true },
  ];
  
  // Dodatkowe wzorce dla akcji bez "computer_use"
  const simplePatterns = [
    { regex: /\bscreenshot\(\)/i, action: "screenshot", hasCoords: false, hasText: false, hasScroll: false },
    { regex: /\bleft_click\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i, action: "left_click", hasCoords: true, hasText: false, hasScroll: false },
    { regex: /\bclick\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i, action: "left_click", hasCoords: true, hasText: false, hasScroll: false },
    { regex: /\btype\s*\(\s*["']([^"']+)["']\s*\)/i, action: "type", hasCoords: false, hasText: true, hasScroll: false },
    { regex: /\bkey\s*\(\s*["']([^"']+)["']\s*\)/i, action: "key", hasCoords: false, hasText: true, hasScroll: false },
    { regex: /\bwait\(\)/i, action: "wait", hasCoords: false, hasText: false, hasScroll: false },
  ];

  // Sprawdź wszystkie wzorce
  const allPatterns = [...patterns, ...simplePatterns];
  
  for (const pattern of allPatterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const matchIndex = match.index || 0;
      const matchLength = match[0].length;
      
      let args: any = { action: pattern.action };
      
      if (pattern.hasCoords && match[1] && match[2]) {
        args.coordinate = [parseInt(match[1]), parseInt(match[2])];
      } else if (pattern.hasText && match[1]) {
        args.text = match[1];
      } else if (pattern.hasScroll && match[1]) {
        const direction = match[1].toLowerCase();
        const amount = match[2] ? parseInt(match[2]) : 3;
        args.delta_y = direction === "down" ? amount * 100 : -amount * 100;
      }
      
      return {
        toolCall: {
          id: `call_text_${Date.now()}`,
          name: "computer_use",
          arguments: JSON.stringify(args),
        },
        textBefore: text.substring(0, matchIndex).trim(),
        textAfter: text.substring(matchIndex + matchLength).trim(),
      };
    }
  }

  return null;
}
