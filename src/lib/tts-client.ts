const SAMPLE_RATE = 24000;

export type TtsError = { status: number; message?: string };

/** Splits long text at sentence boundaries into chunks safely under the model limit. */
export function chunkForTts(text: string, maxChars = 700): string[] {
  const sentences = text.match(/[^.!?؟،\n]+[.!?؟\n]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };
  for (const s of sentences) {
    if (s.length > maxChars) {
      flush();
      for (let i = 0; i < s.length; i += maxChars) chunks.push(s.slice(i, i + maxChars));
      continue;
    }
    if (current.length + s.length > maxChars) flush();
    current += s;
  }
  flush();
  return chunks.length ? chunks : [text];
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function pcmToWav(pcm: Uint8Array, sampleRate = SAMPLE_RATE): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const write = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, pcm.length, true);
  return new Blob([header, pcm.slice().buffer as ArrayBuffer], { type: "audio/wav" });
}

export type SpeakOptions = {
  text: string;
  voice: string;
  speed: number;
  energy: number;
  onProgress?: (done: number, total: number) => void;
};

/**
 * Streams audio for every chunk of `text` from the backend TTS route and
 * returns the full PCM buffer (which the caller turns into a WAV blob).
 */
export async function synthesize({
  text,
  voice,
  speed,
  energy,
  onProgress,
}: SpeakOptions): Promise<Uint8Array> {
  const chunks = chunkForTts(text);
  const parts: Uint8Array[] = [];

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(i, chunks.length);
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: chunks[i], voice, speed, energy }),
    });

    if (!res.ok || !res.body) {
      let message: string | undefined;
      try {
        const j = (await res.json()) as { message?: string };
        message = j.message;
      } catch {
        message = undefined;
      }
      const err: TtsError = { status: res.status, message };
      throw err;
    }

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    let done = false;
    while (true) {
      const { value, done: streamDone } = await reader.read();
      if (streamDone) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payloadText = line.slice(5).trim();
        if (!payloadText || payloadText === "[DONE]") continue;
        let payload: { type?: string; audio?: string };
        try {
          payload = JSON.parse(payloadText) as typeof payload;
        } catch {
          continue;
        }
        if (payload.type === "speech.audio.delta" && payload.audio) {
          parts.push(base64ToBytes(payload.audio));
        } else if (payload.type === "speech.audio.done") {
          done = true;
        }
      }
    }
    if (!done && parts.length === 0) {
      const err: TtsError = { status: 502 };
      throw err;
    }
  }

  onProgress?.(chunks.length, chunks.length);
  const total = parts.reduce((n, p) => n + p.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    merged.set(p, offset);
    offset += p.length;
  }
  return merged;
}

export function arabicErrorMessage(status: number, message?: string): string {
  const extra = message ? ` (${message})` : "";
  switch (status) {
    case 400:
      return "فيه مشكلة في النص المُرسل، تأكد إنه غير فارغ وداخل حد ٢٠٠٠ حرف." + extra;
    case 401:
      return "خدمة الذكاء الاصطناعي غير مهيأة في هذا التطبيق.";
    case 402:
      return "انتهى رصيد الذكاء الاصطناعي في هذه المساحة. لازم صاحب التطبيق يضيف رصيد من إعدادات Lovable ثم تعيد المحاولة.";
    case 403:
      return "الوصول لخدمة الذكاء الاصطناعي محجوب حالياً بسبب إعدادات المساحة.";
    case 404:
      return "خدمة تحويل النص إلى صوت غير متاحة لهذه المساحة.";
    case 429:
      return "الطلبات كثيرة الآن. انتظر شوي وأعد المحاولة بعد لحظات.";
    default:
      if (status >= 500) return "صار خطأ مؤقت في خدمة الصوت. حاول مرة ثانية بعد قليل." + extra;
      return "صار خطأ غير متوقع. حاول مرة ثانية." + extra;
  }
}
