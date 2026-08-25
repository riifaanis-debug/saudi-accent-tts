import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  text: z.string().min(1).max(5000),
});

export type RewriteResult =
  | { ok: true; text: string }
  | { ok: false; status: number; message?: string };

const SYSTEM = `أنت محرر نصوص سعودي محترف. أعد صياغة النص الذي يصلك ليقرأه شاب سعودي (19-20 سنة) أمام لجنة تمويل في بنك.
القواعد:
- جمل قصيرة، كل جملة فكرة واحدة.
- تسلسل منطقي: الفكرة ثم المشكلة ثم الحل ثم الحافز للبنك ثم الخلاصة.
- مفردات سعودية دارجة مهذبة ومفهومة (نجدية/الرياض)، بدون مبالغة وبدون كلمات عامية ركيكة.
- حافظ حرفياً على كل الأرقام والنسب والتواريخ والأسماء والمصطلحات المالية كما هي.
- لا تضف مقدمات ولا تعليقات ولا عناوين ولا قوائم نقطية ولا علامات تنسيق.
- أعد النص المعاد صياغته فقط، ولا شيء غيره.`;

export const rewriteText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<RewriteResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false, status: 401 };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: data.text },
        ],
      }),
    });

    if (!res.ok) {
      const message = await res.text().catch(() => "");
      return { ok: false, status: res.status, message: message.slice(0, 400) };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const out = json.choices?.[0]?.message?.content?.trim();
    if (!out) return { ok: false, status: 502 };
    return { ok: true, text: out };
  });
