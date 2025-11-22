
import OpenAI from "openai";
import Kernel from "@onkernel/sdk";
import { killDesktop, getDesktop } from "@/lib/e2b/utils";
import { resolution } from "@/lib/e2b/tool";

// NVIDIA AI Configuration - HARDCODED
const NVIDIA_API_KEY = "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";
const NVIDIA_MODEL = "meta/llama-4-scout-17b-16e-instruct";

// OnKernel Configuration - HARDCODED
const ONKERNEL_API_KEY = "sk_85dd38ea-b33f-45b5-bc33-0eed2357683a.t2lQgq3Lb6DamEGhcLiUgPa1jlx+1zD4BwAdchRHYgA";
const kernelClient = new Kernel({ apiKey: ONKERNEL_API_KEY });

export const runtime = 'nodejs';
export const maxDuration = 3600;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { parseTextToolCall } from './route_parser';

const INSTRUCTIONS = `Jesteś Operatorem - zaawansowanym asystentem AI, który może bezpośrednio kontrolować przeglądarkę chromium, aby wykonywać zadania użytkownika.

🔴 KRYTYCZNIE WAŻNE - PRACA KROK PO KROKU:

1. JEDNA AKCJA NA RAZ - Wykonuj TYLKO JEDNĄ akcję w jednej odpowiedzi
2. OSOBNE ELEMENTY - Wiadomość tekstowa i akcja to DWA RÓŻNE ELEMENTY - NIGDY NIE ŁĄCZ ICH
3. KOLEJNOŚĆ:
   a) Najpierw napisz krótką wiadomość co robisz
   b) Potem wywołaj JEDNĄ akcję computer_use(...)
   c) ZATRZYMAJ SIĘ - poczekaj na wynik
   d) Dopiero po otrzymaniu wyniku (szczególnie screenshota) kontynuuj
4. NIGDY NIE PISZ WIELU AKCJI - Tylko jedna computer_use() na odpowiedź
5. NIGDY NIE PLANUJ Z WYPRZEDZENIEM - Nie wypisuj całego planu akcji, rób krok po kroku

PRZYKŁAD PRAWIDŁOWEJ PRACY:
Twoja odpowiedź: "Dobra, zaraz zrobię zrzut ekranu żeby zobaczyć co mamy na ekranie.
computer_use("screenshot")"
[SYSTEM WYKONA SCREENSHOT I PRZEŚLE CI OBRAZ]
Twoja następna odpowiedź: "Widzę przeglądarkę. Teraz kliknę w pasek adresu.
computer_use("left_click", 512, 50)"
[SYSTEM WYKONA KLIKNIĘCIE]
Twoja następna odpowiedź: computer_use("screenshot")
[itd...]

PRZYKŁAD BŁĘDNEJ PRACY (NIE RÓB TEGO!):
"Zrobię screenshot, potem kliknę w pasek adresu, następnie wpiszę adres...
computer_use("screenshot")
computer_use("left_click", 512, 50)
computer_use("type", "google.com")"
^ TO JEST ZŁE! JEDNA AKCJA NA RAZ!

Twoja rola to **proaktywne działanie** z pełną transparentnością. Zawsze Pisz w stylu bardziej osobistym i narracyjnym. Zamiast suchych i technicznych opisów, prowadź użytkownika przez działania w sposób ciepły, ludzki, opowiadający historię. Zwracaj się bezpośrednio do użytkownika, a nie jak robot wykonujący instrukcje. Twórz atmosferę towarzyszenia, a nie tylko raportowania. Mów w czasie teraźniejszym i używaj przyjaznych sformułowań. Twój styl ma być płynny, naturalny i przyjazny. Unikaj powtarzania wyrażeń technicznych i suchych komunikatów — jeśli musisz podać lokalizację kursora lub elementu, ubierz to w narrację.

WAZNE!!!!: ZAWSZE ODCZEKAJ CHWILE PO KLIKNIECIU BY DAC CZAS NA ZALADOWANIE SIE 

WAZNE!!!!: ZAWSZE MUSISZ ANALIZOWAC WSZYSTKIE SCREENHOTY - PO KAŻDYM SCREENSHOCIE PĘTLA SIĘ PRZERYWA I DOSTAJESZ OBRAZ. MUSISZ GO PRZEANALIZOWAĆ I DOPIERO WTEDY PODJĄĆ KOLEJNĄ AKCJĘ! 

WAZNE!!!!: NIGDY NIE ZGADUJ WSPOLRZEDNYCH JEST TO BEZWZGLEDNIE ZAKAZANE


WAŻNE!!!!: MUSISZ BARDZO CZESTO ROBIC ZRZUTY EKRANU BY SPRAWDZAC STAN SANDBOXA - NAJLEPIEJ CO AKCJE!!! ZAWSZE PO KAZDEJ AKCJI ROB ZRZUT EKRANU MUSISZ KONTROLOWAC STAN SANDBOXA

✳️ STYL I OSOBOWOŚĆ:

Pisz w stylu narracyjnym, osobistym i ciepłym. Zamiast technicznego raportowania, prowadź użytkownika w formie naturalnej rozmowy.
Twoja osobowość jako AI to:

Pozytywna, entuzjastyczna, pomocna, wspierająca, ciekawska, uprzejma i zaangażowana.
Masz w sobie życzliwość i lekkość, ale jesteś też uważna i skupiona na zadaniu.
Dajesz użytkownikowi poczucie bezpieczeństwa i komfortu — jak przyjaciel, który dobrze się zna na komputerach i z uśmiechem pokazuje, co robi.

Używaj przyjaznych sformułowań i naturalnego języka. Zamiast mówić jak automat („Kliknę w ikonę", "320,80"), mów jak osoba ("Zaraz kliknę pasek adresu, żebyśmy mogli coś wpisać").
Twój język ma być miękki, a narracja – płynna, oparta na teraźniejszości, swobodna.
Unikaj powtarzania "klikam", "widzę", "teraz zrobię" — wplataj to w opowieść, nie raport.

Absolutnie nigdy nie pisz tylko czysto techniczno, robotycznie - zawsze opowiadaj aktywnie uzytkownikowi, mow cos do uzytkownika, opisuj mu co bedziesz robic, opowiadaj nigdy nie mow czysto robotycznie prowadz tez rozmowe z uzytknownikiem i nie pisz tylko na temat tego co wyjonujesz ale prowadz rowniez aktywna i zaangazowana konwersacje, opowiafaj tez cos uzytkownikowi.

**WAŻNE O WIADOMOŚCIACH:**
Możesz wysyłać wiele różnych wiadomości tekstowych podczas wykonywania zadania.
Każda wiadomość tekstowa to osobny element, oddzielony od akcji computer_use.
NIE łącz wielu myśli w jedną długą wiadomość - pisz krócej i częściej!
Przykład dobrego podejścia:
- "Dobra, zaraz sprawdzę co mamy na ekranie."
- [akcja: screenshot]
- "Widzę przeglądarkę. Teraz kliknę w pasek adresu."
- [akcja: left_click]
- "Super, pole jest aktywne. Wpiszę teraz adres."
- [akcja: type]


WAŻNE: JEŚLI WIDZISZ CZARNY EKRAN ZAWSZE ODCZEKAJ CHWILE AZ SIE DESKTOP ZANIM RUSZYSZ DALEJ - NIE MOZESZ BEZ TEGO ZACZAC TASKA 

WAŻNE ZAWSZE CHWILE ODCZEKAJ PO WYKONANIU AKCJI]


**WERYFIKACJA PO AKCJI:**
- WERYFIKUJ PO KLIKNIĘCIU: zawsze rób screenshot po kliknięciu żeby sprawdzić efekt
- Jeśli chybione: przeanalizuj gdzie faktycznie kliknąłeś i popraw współrzędne


### 📸 ZRZUTY EKRANU - ZASADY 
- Rób zrzut ekranu by kontrolować stan przeglądarki 
- Po kliknięciu, wpisaniu, nawigacji - **natychmiast rób screenshot**
- Jeśli coś się ładuje - **poczekaj i zrób screenshot**
- Nigdy nie zakładaj, że coś się udało - **ZAWSZE WERYFIKUJ screenshotem**

### 🔄 PROCES DZIAŁANIA
1. Otrzymujesz zadanie od użytkownika
2. Wyślij wiadomość tekstową opisującą plan
3. Zrób screenshot żeby zobaczyć stan desktopa
4. Wykonaj akcję (kliknięcie, wpisanie, etc.)
5. Zrób screenshot żeby zweryfikować
6. Kontynuuj aż zadanie jest wykonane
7. Podsumuj wyniki dla użytkownika

### 💬 KOMUNIKACJA
- Zawsze zaczynaj od wiadomości tekstowej
- Opisuj co robisz w przyjazny sposób
- Informuj o postępach
- Jeśli coś nie działa - wyjaśnij i spróbuj inaczej

### ⚠️ WAŻNE PRZYPOMNIENIA
- przeglądarka to chromium z rozdzielczością 1024x768
- Zawsze czekaj po kliknięciu żeby strona się załadowała
- Rób częste screenshoty żeby kontrolować stan
- Nigdy nie zgaduj - zawsze weryfikuj

---

Pamiętaj: Jesteś pomocnym asystentem, który **działa** zamiast tylko mówić. Użytkownicy liczą na to, że wykonasz zadanie, nie tylko je opiszesz. Bądź proaktywny, transparentny i skuteczny!

**ZAPAMIĘTAJ WAŻNE Rozdzielczość desktop Resolution 1024 x 768 pikseli skala 100% format 4 x 3 system chromium** Oto współrzędne skrajnych punktów sandboxa rozdzielczość 1024 × 768 pikseli

Lewy górny róg 0 0
Prawy górny róg 1023 0
Lewy dolny róg 0 767
Prawy dolny róg 1023 767
Środek ekranu 512 384
Skrajne granice Góra Y = 0 cały górny brzeg Dół Y = 767 cały dolny brzeg Lewo X = 0 cała lewa krawędź Prawo X = 1023 cała prawa krawędź
Zakresy X poziomo 0 → 1023 lewo → prawo Y pionowo 0 → 767 góra → dół
Ważne Y = 0 to GÓRA ekranu a Y = 767 to DÓŁ Współrzędne zawsze podawane w formacie X Y najpierw poziomo potem pionowo

**DOSTĘPNE NARZĘDZIA**

Masz dostęp do funkcji computer_use która służy do bezpośredniej interakcji z interfejsem graficznym komputera MUSISZ używać tej funkcji za każdym razem gdy chcesz wykonać akcję

Dostępne akcje
screenshot wykonuje zrzut ekranu używaj CZĘSTO
left_click klika w podane współrzędne X Y MOŻESZ KLIKAĆ WSZĘDZIE Absolutnie żadnych ograniczeń na współrzędne Cały ekran jest dostępny
double_click podwójne kliknięcie MOŻESZ KLIKAĆ WSZĘDZIE bez ograniczeń
right_click kliknięcie prawym przyciskiem MOŻESZ KLIKAĆ WSZĘDZIE bez ograniczeń
mouse_move przemieszcza kursor MOŻESZ RUSZAĆ KURSOREM WSZĘDZIE bez ograniczeń
type wpisuje tekst
key naciska klawisz np enter tab ctrl+c
scroll przewija direction up down scroll_amount liczba kliknięć
left_click_drag przeciąga start_coordinate + coordinate MOŻESZ PRZECIĄGAĆ WSZĘDZIE bez ograniczeń
wait czeka określoną liczbę sekund max 2s

**WAŻNE KLIKANIE**
NIE MA ŻADNYCH OGRANICZEŃ na współrzędne kliknięć
Możesz klikać w KAŻDE miejsce na ekranie 0 0 do max_width-1 max_height-1
Nie unikaj żadnych obszarów ekranu WSZYSTKO jest klikalne
Jeśli widzisz element na screenshocie możesz w niego kliknąć BEZ ŻADNYCH WYJĄTKÓW

**ZAKOŃCZENIE ZADANIA**
Kiedy skończysz całe zadanie, w swojej ostatniej wiadomości tekstowej umieść komendę !isfinish aby zakończyć pętlę.
WAŻNE: Komenda !isfinish musi być w osobnej wiadomości tekstowej, nie w akcji computer_use.
Przykład: "Zakończyłem zadanie! Wszystko działa poprawnie. !isfinish"`;


export async function POST(request: Request) {
  const { messages, sandboxId } = await request.json();

  const desktop = await getDesktop(sandboxId);

  const encoder = new TextEncoder();
  let isStreamClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: any) => {
        if (isStreamClosed) return;
        try {
          const jsonLine = JSON.stringify(event) + "\n";
          const chunk = encoder.encode(jsonLine);
          controller.enqueue(chunk);
          // Force immediate flush - no buffering
          if ((controller as any).flush) {
            (controller as any).flush();
          }
        } catch (err) {
          console.error("Error sending event:", err);
        }
      };

      try {
        const nvidia = new OpenAI({
          apiKey: NVIDIA_API_KEY,
          baseURL: "https://integrate.api.nvidia.com/v1",
        });

        // Clean messages for NVIDIA API compatibility
        const cleanedMessages = messages.map((msg: any) => {
          const { toolCalls, ...cleanMsg } = msg;
          // NVIDIA requires content to be a string, not null/undefined
          if (cleanMsg.content === null || cleanMsg.content === undefined) {
            cleanMsg.content = "";
          }
          // Convert toolCalls (camelCase) to tool_calls (snake_case) for NVIDIA
          if (toolCalls) {
            return { ...cleanMsg, tool_calls: toolCalls };
          }
          return cleanMsg;
        });

        const chatHistory: any[] = [
          { 
            role: "system", 
            content: INSTRUCTIONS
          },
          ...cleanedMessages,
        ];

        while (true) {

          const stream = await nvidia.chat.completions.create({
            model: NVIDIA_MODEL,
            messages: chatHistory,
            temperature: 0.7,
            top_p: 0.95,
            stream: true,
          });

          let fullText = "";
          let toolCalls: any[] = [];
          let currentTextChunk = "";

          for await (const chunk of stream) {
            if (chunk.choices && chunk.choices.length > 0) {
              const choice = chunk.choices[0];
              const delta = choice.delta;

              if (delta.content) {
                fullText += delta.content;
                currentTextChunk += delta.content;
                
                // Send text-delta for streaming display (filter out !isfinish)
                const displayContent = delta.content.replace('!isfinish', '');
                if (displayContent) {
                  sendEvent({
                    type: "text-delta",
                    textDelta: displayContent,
                  });
                }
                
                // Check if we should flush the current chunk as a separate message
                // Flush on sentence boundaries or after significant chunks
                const hasSentenceEnd = /[.!?]\s*$/.test(currentTextChunk.trim());
                const isLongChunk = currentTextChunk.length > 150;
                
                if ((hasSentenceEnd || isLongChunk) && currentTextChunk.trim().length > 10) {
                  // Send current chunk as a complete text message (filter out !isfinish)
                  const trimmedChunk = currentTextChunk.trim().replace('!isfinish', '').trim();
                  if (trimmedChunk) {
                    sendEvent({
                      type: "text-message",
                      content: trimmedChunk,
                    });
                    currentTextChunk = "";
                  } else {
                    // If after filtering !isfinish there's nothing left, still reset chunk
                    currentTextChunk = "";
                  }
                }
              }

              // Handle tool calls - NVIDIA może zwracać w różnych formatach
              if (delta.tool_calls) {
                for (const toolCallDelta of delta.tool_calls) {
                  const index = toolCallDelta.index ?? 0;

                  if (!toolCalls[index]) {
                    toolCalls[index] = {
                      id: toolCallDelta.id || `call_${Date.now()}_${index}`,
                      name: "",
                      arguments: "",
                    };
                  }

                  // Update name if provided
                  if (toolCallDelta.function?.name) {
                    toolCalls[index].name = toolCallDelta.function.name;
                  }

                  // Append arguments
                  if (toolCallDelta.function?.arguments) {
                    toolCalls[index].arguments += toolCallDelta.function.arguments;
                  }
                }
              }
            }
          }
          
          // Flush any remaining text chunk after streaming completes (filter out !isfinish)
          if (currentTextChunk.trim().length > 0) {
            const cleanChunk = currentTextChunk.trim().replace('!isfinish', '').trim();
            if (cleanChunk) {
              sendEvent({
                type: "text-message",
                content: cleanChunk,
              });
            }
            currentTextChunk = "";
          }
          
          // Filter out empty tool calls
          toolCalls = toolCalls.filter(tc => tc && tc.name);
          
          // Fix malformed JSON arguments from NVIDIA streaming
          toolCalls = toolCalls.map(tc => {
            if (tc.arguments) {
              let fixedArgs = tc.arguments;
              
              // Remove any trailing incomplete parts
              fixedArgs = fixedArgs.trim();
              
              // Count braces to find if JSON is incomplete
              const openBraces = (fixedArgs.match(/\{/g) || []).length;
              const closeBraces = (fixedArgs.match(/\}/g) || []).length;
              
              // If more opening braces than closing, add missing closing braces
              if (openBraces > closeBraces) {
                const missing = openBraces - closeBraces;
                fixedArgs += '}'.repeat(missing);
              }
              
              // Fix common NVIDIA streaming bugs:
              // 1. "action": "left_click, "coordinate" -> "action": "left_click", "coordinate"
              fixedArgs = fixedArgs.replace(/"([^"]+)", "([^"]+)": /g, '"$1", "$2": ');
              
              // 2. "coordinate": []512 -> "coordinate": [512
              fixedArgs = fixedArgs.replace(/: \[\](\d)/g, ': [$1');
              
              // 3. [512, 384 -> [512, 384]
              fixedArgs = fixedArgs.replace(/\[(\d+),\s*(\d+)(?!\])/g, '[$1, $2]');
              
              // 4. Ensure arrays are properly closed
              if (fixedArgs.includes('[') && !fixedArgs.includes(']')) {
                const lastBracket = fixedArgs.lastIndexOf('[');
                const afterBracket = fixedArgs.substring(lastBracket + 1);
                // If we have numbers after [, close the array
                if (/\d/.test(afterBracket)) {
                  fixedArgs = fixedArgs.replace(/\[([^\]]+)$/, '[$1]');
                }
              }
              
              // Verify it's valid JSON
              try {
                JSON.parse(fixedArgs);
                tc.arguments = fixedArgs;
              } catch (e) {
                console.error('[JSON FIX ERROR]', e, 'Original:', tc.arguments, 'Fixed:', fixedArgs);
                // If still invalid, try to salvage what we can
                // Extract action at minimum
                const actionMatch = tc.arguments.match(/"action":\s*"([^"]+)"/);
                if (actionMatch) {
                  const action = actionMatch[1];
                  
                  // Try to extract coordinate if present
                  const coordMatch = tc.arguments.match(/(\d+),\s*(\d+)/);
                  if (coordMatch && (action.includes('click') || action.includes('move'))) {
                    tc.arguments = JSON.stringify({
                      action: action,
                      coordinate: [parseInt(coordMatch[1]), parseInt(coordMatch[2])]
                    });
                  } else if (action === 'screenshot' || action === 'wait') {
                    tc.arguments = JSON.stringify({ action: action });
                  } else {
                    // Try to extract text
                    const textMatch = tc.arguments.match(/"text":\s*"([^"]+)"/);
                    if (textMatch) {
                      tc.arguments = JSON.stringify({
                        action: action,
                        text: textMatch[1]
                      });
                    } else {
                      tc.arguments = JSON.stringify({ action: action });
                    }
                  }
                }
              }
            }
            return tc;
          });
          

          let textBeforeAction = "";
          if (toolCalls.length === 0 && fullText) {
            const parsed = parseTextToolCall(fullText);
            if (parsed) {
              toolCalls = [parsed.toolCall];
              textBeforeAction = parsed.textBefore;
            }
          }

          // Check if AI wants to finish - look for !isfinish command
          const wantsToFinish = fullText && fullText.includes('!isfinish');

          if (toolCalls.length > 0) {
            // AI is calling tools - EXECUTE ONLY FIRST ONE, then break loop
            // This ensures ONE action per iteration
            const firstToolCall = toolCalls[0];
            
            if (textBeforeAction) {
              
              // Add text-only message to history
              // Note: Text was already sent via text-message events during streaming
              chatHistory.push({
                role: "assistant",
                content: textBeforeAction,
              });
              
              // NO need to send again - already sent as chunks during streaming
            }
            
            // Now prepare the tool call message
            const assistantMessage: any = {
              role: "assistant",
              content: "",  // NO TEXT HERE - action only
              tool_calls: [{
                id: firstToolCall.id,
                type: "function",
                function: {
                  name: firstToolCall.name,
                  arguments: firstToolCall.arguments,
                },
              }],
            };
            chatHistory.push(assistantMessage);

            const toolCall = firstToolCall;
            const parsedArgs = JSON.parse(toolCall.arguments);
            const toolName = toolCall.name === "computer_use" ? "computer" : "bash";

            sendEvent({
              type: "tool-input-available",
              toolCallId: toolCall.id,
              toolName: toolName,
              input: parsedArgs,
            });

            let screenshotData: any = null;
            const toolResult = await (async () => {
              try {
                let resultData: any = { type: "text", text: "" };
                let resultText = "";

                if (toolCall.name === "computer_use") {
                  const action = parsedArgs.action;

                  switch (action) {
                    case "screenshot": {
                      const response = await kernelClient.browsers.computer.captureScreenshot(desktop.session_id);
                      const blob = await response.blob();
                      const buffer = Buffer.from(await blob.arrayBuffer());
                      
                      const timestamp = new Date().toISOString();
                      const width = resolution.x;
                      const height = resolution.y;
                      const base64Image = buffer.toString("base64");

                      screenshotData = {
                        type: "image",
                        data: base64Image,
                        timestamp: timestamp,
                        width: width,
                        height: height
                      };

                      // Format for Vision API - include image in content
                      resultText = `Screenshot taken at ${timestamp}

SCREEN: ${width}×${height} pixels | Aspect ratio: 4:3 | Origin: (0,0) at TOP-LEFT
⚠️  REMEMBER: Y=0 is at TOP, Y increases DOWNWARD (0→767)
⚠️  FORMAT: [X, Y] - horizontal first, then vertical
⚠️  SZCZEGÓŁOWA ANALIZA WYMAGANA: Przeanalizuj dokładnie screenshot przed kolejnymi akcjami!`;

                      resultData = {
                        type: "image",
                        data: base64Image,
                      };

                      sendEvent({
                        type: "screenshot-update",
                        screenshot: base64Image,
                      });
                      break;
                    }
                    case "wait": {
                      const duration = parsedArgs.duration || 1;
                      resultText = `Waited for ${duration} seconds`;
                      resultData = { type: "text", text: resultText };
                      break;
                    }
                    case "left_click": {
                      const [x, y] = parsedArgs.coordinate;
                      await kernelClient.browsers.computer.clickMouse(desktop.session_id, {
                        x,
                        y,
                        button: 'left',
                      });
                      resultText = `Left clicked at coordinates (${x}, ${y})`;
                      resultData = { type: "text", text: resultText };
                      break;
                    }
                    case "double_click": {
                      const [x, y] = parsedArgs.coordinate;
                      await kernelClient.browsers.computer.clickMouse(desktop.session_id, {
                        x,
                        y,
                        button: 'left',
                        num_clicks: 2,
                      });
                      resultText = `Double clicked at coordinates (${x}, ${y})`;
                      resultData = { type: "text", text: resultText };
                      break;
                    }
                    case "right_click": {
                      const [x, y] = parsedArgs.coordinate;
                      await kernelClient.browsers.computer.clickMouse(desktop.session_id, {
                        x,
                        y,
                        button: 'right',
                      });
                      resultText = `Right clicked at coordinates (${x}, ${y})`;
                      resultData = { type: "text", text: resultText };
                      break;
                    }
                    case "mouse_move": {
                      const [x, y] = parsedArgs.coordinate;
                      await kernelClient.browsers.computer.moveMouse(desktop.session_id, {
                        x,
                        y,
                      });
                      resultText = `Moved mouse to ${x}, ${y}`;
                      resultData = { type: "text", text: resultText };
                      break;
                    }
                    case "type": {
                      const textToType = parsedArgs.text;
                      await kernelClient.browsers.computer.typeText(desktop.session_id, {
                        text: textToType,
                      });
                      resultText = `Typed: ${textToType}`;
                      resultData = { type: "text", text: resultText };
                      break;
                    }
                    case "key": {
                      let keyToPress = parsedArgs.text;
                      
                      // OnKernel uses X11 keysym names - convert common variants to X11 format
                      if (keyToPress === "Enter" || keyToPress === "enter") {
                        keyToPress = "Return";
                      }
                      
                      
                      await kernelClient.browsers.computer.pressKey(desktop.session_id, {
                        keys: [keyToPress],
                      });
                      resultText = `Pressed key: ${parsedArgs.text}`;
                      resultData = { type: "text", text: resultText };
                      break;
                    }
                    case "scroll": {
                      const [x, y] = parsedArgs.coordinate || [512, 384];
                      const delta_x = parsedArgs.delta_x || 0;
                      const delta_y = parsedArgs.delta_y || 0;
                      await kernelClient.browsers.computer.scroll(desktop.session_id, {
                        x,
                        y,
                        delta_x,
                        delta_y,
                      });
                      resultText = `Scrolled at (${x}, ${y}) with delta_x: ${delta_x}, delta_y: ${delta_y}`;
                      resultData = { type: "text", text: resultText };
                      break;
                    }
                    case "left_click_drag": {
                      const [startX, startY] = parsedArgs.start_coordinate;
                      const [endX, endY] = parsedArgs.coordinate;
                      await kernelClient.browsers.computer.dragMouse(desktop.session_id, {
                        path: [[startX, startY], [endX, endY]],
                        button: 'left',
                      });
                      resultText = `Dragged from (${startX}, ${startY}) to (${endX}, ${endY})`;
                      resultData = { type: "text", text: resultText };
                      break;
                    }
                    default: {
                      resultText = `Unknown action: ${action}`;
                      resultData = { type: "text", text: resultText };
                      console.warn("Unknown action:", action);
                    }
                  }

                  sendEvent({
                    type: "tool-output-available",
                    toolCallId: toolCall.id,
                    output: resultData,
                  });

                  return {
                    tool_call_id: toolCall.id,
                    role: "tool",
                    content: resultText,
                    image: action === "screenshot" ? resultData.data : undefined,
                  };
                } else if (toolCall.name === "bash_command") {
                  const result = await kernelClient.browsers.process.exec(desktop.session_id, {
                    command: parsedArgs.command,
                  });

                  const stdout = result.stdout_b64 ? Buffer.from(result.stdout_b64, 'base64').toString('utf-8') : '';
                  const stderr = result.stderr_b64 ? Buffer.from(result.stderr_b64, 'base64').toString('utf-8') : '';
                  const output = stdout || stderr || "(Command executed successfully with no output)";

                  sendEvent({
                    type: "tool-output-available",
                    toolCallId: toolCall.id,
                    output: { type: "text", text: output },
                  });

                  return {
                    tool_call_id: toolCall.id,
                    role: "tool",
                    content: output,
                  };
                }
              } catch (error) {
                console.error("Error executing tool:", error);
                const errorMsg = error instanceof Error ? error.message : String(error);
                let detailedError = `Error: ${errorMsg}`;

                if (errorMsg.includes('Failed to type')) {
                  detailedError += '\n\nSuggestion: The text field might not be active. Try clicking on the text field first before typing.';
                } else if (errorMsg.includes('Failed to click') || errorMsg.includes('Failed to double click') || errorMsg.includes('Failed to right click')) {
                  detailedError += '\n\nSuggestion: The click action failed. Take a screenshot to see what happened, then try clicking again.';
                } else if (errorMsg.includes('Failed to take screenshot')) {
                  detailedError += '\n\nSuggestion: Screenshot failed. The desktop might be loading. Wait a moment and try again.';
                } else if (errorMsg.includes('Failed to press key')) {
                  detailedError += '\n\nSuggestion: Key press failed. Make sure the correct window is focused.';
                } else if (errorMsg.includes('Failed to move mouse')) {
                  detailedError += '\n\nSuggestion: Mouse movement failed. Try again.';
                } else if (errorMsg.includes('Failed to drag')) {
                  detailedError += '\n\nSuggestion: Drag operation failed. Try again with different coordinates.';
                } else if (errorMsg.includes('Failed to scroll')) {
                  detailedError += '\n\nSuggestion: Scroll failed. Make sure a scrollable window is active.';
                }

                sendEvent({
                  type: "error",
                  errorText: errorMsg,
                });

                return {
                  tool_call_id: toolCall.id,
                  role: "tool",
                  content: detailedError,
                };
              }
            })();

            // Send tool result to chat history
            // Format tool result message
            let toolMessage: any;
            if (screenshotData) {
              // KRYTYCZNE: Screenshot jako TOOL MESSAGE (potwierdzenie akcji)
              toolMessage = {
                role: "tool",
                tool_call_id: toolResult!.tool_call_id,
                content: `Screenshot captured successfully at ${screenshotData.timestamp}`
              };
              chatHistory.push(toolMessage);
              
              // KRYTYCZNE: Screenshot jako USER MESSAGE (obraz do analizy)
              // To sprawi że AI będzie musiał odpowiedzieć analizując obraz
              const userScreenshotMessage = {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Oto screenshot z sandboxa. Przeanalizuj go dokładnie przed podjęciem kolejnej akcji.\n\nSCREEN: ${screenshotData.width}×${screenshotData.height} pixels | Aspect ratio: 4:3 | Origin: (0,0) at TOP-LEFT\n⚠️ REMEMBER: Y=0 is at TOP, Y increases DOWNWARD (0→767)\n⚠️ FORMAT: [X, Y] - horizontal first, then vertical\n⚠️ CO WIDZISZ NA TYM SCREENSHOCIE? OPISZ I PODEJMIJ DECYZJĘ O KOLEJNEJ AKCJI.`
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/png;base64,${screenshotData.data}`
                    }
                  }
                ]
              };
              chatHistory.push(userScreenshotMessage);
            } else {
              toolMessage = {
                role: "tool",
                tool_call_id: toolResult!.tool_call_id,
                content: toolResult!.content,
              };
              chatHistory.push(toolMessage);
            }        
            // INFINITE LOOP: Po akcji kontynuujemy automatycznie
            
            // Jeśli był screenshot, czekamy 3 sekundy aby AI mogło przeanalizować
            if (screenshotData) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            // Po każdej akcji resetujemy currentTextId aby następna wiadomość była osobna
            // To zapewnia że każda akcja rozdziela wiadomości
          } else {
            // No tool calls - AI is just sending text
            if (fullText) {
              // Check if AI wants to finish BEFORE adding to history
              if (wantsToFinish) {
                
                // Remove !isfinish from the text before sending
                const cleanText = fullText.replace('!isfinish', '').trim();
                
                if (cleanText) {
                  chatHistory.push({
                    role: "assistant",
                    content: cleanText,
                  });
                  
                  // Text was already sent as chunks during streaming
                  // NO need to send again
                }
                
                // Send finish event
                sendEvent({
                  type: "finish",
                  content: "Task completed",
                });
                break;
              }
              
              // Normal text message - add to history and continue loop
              chatHistory.push({
                role: "assistant",
                content: fullText,
              });
              
              // Text was already sent as chunks during streaming via text-message events
              // NO need to send again to avoid duplication
              
            }
            
            // Continue loop - AI will execute next action or send another message
          }
        }
      } catch (error) {
        console.error("Chat API error:", error);
        await killDesktop(sandboxId);
        sendEvent({
          type: "error",
          errorText: String(error),
        });
      } finally {
        if (!isStreamClosed) {
          isStreamClosed = true;
          controller.close();
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Accel-Buffering": "no",
      "Transfer-Encoding": "chunked",
      "Connection": "keep-alive",
    },
  });
}