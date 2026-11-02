import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Mic, Volume2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { rewriteText } from "@/lib/rewrite.functions";
import { arabicErrorMessage, pcmToWav, synthesize, type TtsError } from "@/lib/tts-client";

const MAX = 5000;

const VOICES = [
  { id: "Puck", name: "فهد", desc: "شاب حيوي واثق" },
  { id: "Fenrir", name: "تركي", desc: "نبرة قوية حاسمة" },
  { id: "Orus", name: "عبدالله", desc: "هادئ رسمي مقنع" },
  { id: "Charon", name: "ناصر", desc: "دافئ ودّي واضح" },
  { id: "Algenib", name: "سلمان", desc: "ثلاثيني رسمي جهوري" },
  { id: "Leda", name: "نوف", desc: "بنت عشرينية عامية بدلع" },
  { id: "Umbriel", name: "سامي", desc: "شاب عشريني جنوبي بدوي" },
  { id: "Iapetus", name: "ماجد", desc: "شاب 28 سنة رسمي يعرض سيرته" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "صوت العرض المصرفي | تحويل نصك لصوت شاب سعودي" },
      {
        name: "description",
        content:
          "اكتب نصك بالعربية واحصل على صوت شاب سعودي بلهجة نجدية واثقة يعرض مشروعك أمام لجنة البنك، مع إعادة صياغة ذكية وتنزيل الملف الصوتي.",
      },
      { property: "og:title", content: "صوت العرض المصرفي | تحويل نصك لصوت شاب سعودي" },
      {
        property: "og:description",
        content:
          "إعادة صياغة النص بأسلوب عرض مصرفي سعودي ثم تحويله إلى صوت واضح بلهجة الرياض، مع تنزيل الملف الصوتي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Stage = "idle" | "rewriting" | "speaking";

function Index() {
  const rewrite = useServerFn(rewriteText);
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("Puck");
  const [speed, setSpeed] = useState([1]);
  const [energy, setEnergy] = useState([6]);
  const [raw, setRaw] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [scriptOut, setScriptOut] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const busy = stage !== "idle";
  const remaining = MAX - text.length;

  const handleError = (status: number, message?: string) => {
    toast.error(arabicErrorMessage(status, message));
  };

  const onSubmit = async () => {
    const value = text.trim();
    if (!value) {
      toast.error("اكتب النص أول، المربع فاضي.");
      return;
    }
    if (value.length > MAX) {
      toast.error(`النص أطول من الحد المسموح (${MAX} حرف).`);
      return;
    }

    let script = value;
    try {
      if (!raw && voice !== "Leda" && voice !== "Umbriel" && voice !== "Iapetus") {
        setStage("rewriting");
        const result = await rewrite({ data: { text: value } });
        if (!result.ok) {
          handleError(result.status, result.message);
          setStage("idle");
          return;
        }
        script = result.text;
      }
      setScriptOut(script);

      setStage("speaking");
      const pcm = await synthesize({
        text: script,
        voice,
        speed: speed[0] ?? 1,
        energy: energy[0] ?? 6,
      });
      if (!pcm.length) {
        handleError(502);
        setStage("idle");
        return;
      }
      const url = URL.createObjectURL(pcmToWav(pcm));
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setAudioUrl(url);
      setStage("idle");
      requestAnimationFrame(() => {
        audioRef.current?.play().catch(() => {});
      });
    } catch (err) {
      const e = err as TtsError;
      if (typeof e?.status === "number") handleError(e.status, e.message);
      else toast.error("تعذر الاتصال بالخدمة. تأكد من الإنترنت وحاول مرة ثانية.");
      setStage("idle");
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div
        className="border-b border-border/60"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary) 0%, oklch(0.24 0.05 246) 60%, oklch(0.3 0.055 258) 100%)",
        }}
      >
        <div className="mx-auto max-w-3xl px-5 py-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="size-3.5" /> مدعوم بالذكاء الاصطناعي
          </span>
          <h1 className="mt-4 text-3xl font-bold text-primary-foreground sm:text-4xl">
            صوت العرض المصرفي
          </h1>
          <p className="mt-3 text-sm leading-7 text-primary-foreground/75 sm:text-base">
            اكتب نصك، ونحوّله لصوت شاب سعودي بلهجة نجدية واثقة، كأنه يعرض المشروع أمام لجنة في البنك.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 px-5 py-8">
        <Card className="shadow-sm">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="space-y-2">
              <div className="flex items-end justify-between gap-3">
                <Label htmlFor="script" className="text-base font-semibold">
                  نص العرض
                </Label>
                <span
                  className={
                    remaining < 100
                      ? "text-xs font-semibold text-destructive"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {text.length} / {MAX}
                </span>
              </div>
              <Textarea
                id="script"
                dir="rtl"
                rows={9}
                maxLength={MAX}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="اكتب هنا فكرة المشروع، الأرقام، والجدوى… وخلّنا نحوّلها لعرض مسموع."
                className="resize-y text-base leading-8"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>الصوت</Label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICES.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} — {v.desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>سرعة الكلام</Label>
                  <span className="text-xs text-muted-foreground">
                    {(speed[0] ?? 1).toFixed(2)}×
                  </span>
                </div>
                <Slider min={0.7} max={1.3} step={0.05} value={speed} onValueChange={setSpeed} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>مستوى الحماسة والود</Label>
                <span className="text-xs text-muted-foreground">
                  {energy[0] ?? 6} / 10
                </span>
              </div>
              <Slider min={1} max={10} step={1} value={energy} onValueChange={setEnergy} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>رسمي هادئ</span>
                <span>متحمّس ودّي</span>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-secondary p-3">
              <Checkbox
                id="raw"
                checked={raw}
                onCheckedChange={(v) => setRaw(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="raw" className="cursor-pointer text-sm font-normal leading-6">
                أرسل نصي كما هو بدون تعديل
                <span className="block text-xs text-muted-foreground">
                  عند التحديد نتجاوز خطوة إعادة الصياغة ونقرأ نصك حرفياً.
                </span>
              </Label>
            </div>

            <Button
              onClick={onSubmit}
              disabled={busy}
              size="lg"
              className="h-12 w-full text-base font-semibold"
            >
              {stage === "rewriting" ? (
                <span key="rw" className="inline-flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span>جاري إعادة الصياغة…</span>
                </span>
              ) : stage === "speaking" ? (
                <span key="sp" className="inline-flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span>جاري توليد الصوت…</span>
                </span>
              ) : (
                <span key="idle" className="inline-flex items-center gap-2">
                  <Mic className="size-5" />
                  <span>استمع</span>
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        {scriptOut && (
          <Card className="shadow-sm">
            <CardContent className="space-y-3 p-5 sm:p-6">
              <Label htmlFor="rewritten" className="text-base font-semibold">
                {raw ? "النص المُرسل" : "النص بعد إعادة الصياغة"}
              </Label>
              <Textarea
                id="rewritten"
                dir="rtl"
                rows={7}
                value={scriptOut}
                onChange={(e) => setScriptOut(e.target.value)}
                className="resize-y bg-secondary/40 text-base leading-8"
              />
              <p className="text-xs text-muted-foreground">
                تقدر تعدّل النص هنا، وبعدها اضغط «استمع» مع تحديد «أرسل نصي كما هو» إذا نسخته للأعلى.
              </p>
            </CardContent>
          </Card>
        )}

        {audioUrl && (
          <Card className="border-accent/40 shadow-sm">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center gap-2 text-base font-semibold">
                <Volume2 className="size-5 text-accent" /> الملف الصوتي
              </div>
              <audio ref={audioRef} src={audioUrl} controls className="w-full" />
              <Button asChild variant="secondary" className="w-full">
                <a href={audioUrl} download="عرض-مصرفي.wav">
                  <Download className="size-4" /> تنزيل الملف الصوتي
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
