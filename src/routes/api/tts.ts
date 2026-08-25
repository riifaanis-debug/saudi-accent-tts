import { createFileRoute } from "@tanstack/react-router";

const VOICES = new Set(["Puck", "Fenrir", "Orus", "Charon"]);

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response(JSON.stringify({ message: "المفتاح غير مهيأ" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        let body: { text?: unknown; voice?: unknown; speed?: unknown; energy?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response(JSON.stringify({ message: "طلب غير صالح" }), { status: 400 });
        }

        const text = typeof body.text === "string" ? body.text.trim() : "";
        const voice = typeof body.voice === "string" && VOICES.has(body.voice) ? body.voice : "Puck";
        const speed = typeof body.speed === "number" ? body.speed : 1;
        const energy = typeof body.energy === "number" ? body.energy : 5;

        if (!text) {
          return new Response(JSON.stringify({ message: "النص فارغ" }), { status: 400 });
        }
        if (text.length > 5000) {
          return new Response(JSON.stringify({ message: "النص أطول من الحد المسموح" }), {
            status: 400,
          });
        }

        const pace = speed < 0.9 ? "بإيقاع هادئ ومتمهّل" : speed > 1.1 ? "بإيقاع سريع نشِط" : "بإيقاع متوازن";
        const mood =
          energy <= 3
            ? "بنبرة رسمية رصينة وهدوء واثق"
            : energy >= 8
              ? "بنبرة متحمّسة ودّية مقنعة"
              : "بنبرة واثقة ودّية معتدلة";

        const direction = `اقرأ النص التالي بصوت شاب سعودي عمره تسعة عشر إلى عشرين سنة، بلهجة سعودية نجدية واضحة (لهجة الرياض)، ${mood}، ${pace}، كأنك مصرفي شاب تعرض مشروعاً أمام لجنة في بنك: أسلوب عرض تقديمي حيوي غير جامد، وقفات قصيرة عند النقاط المهمة، وتشديد خفيف على الأرقام والكلمات المفتاحية مثل المشروع والجدوى والتمويل والنسب. لا تقرأ هذه التعليمات:\n\n${text}`;

        try {
          const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-pro-tts",
              stream_format: "sse",
              contents: [{ role: "user", parts: [{ text: direction }] }],
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
                },
              },
            }),
            signal: request.signal,
          });

          if (!res.ok || !res.body) {
            const message = await res.text().catch(() => "");
            return new Response(JSON.stringify({ message: message.slice(0, 400) }), {
              status: res.status,
              headers: { "content-type": "application/json" },
            });
          }

          return new Response(res.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
            },
          });
        } catch (err) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          throw err;
        }
      },
    },
  },
});
