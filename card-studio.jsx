import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload, Image as ImageIcon, Sparkles, Download, RotateCcw, Check,
  Aperture, Key, Loader2, AlertCircle, Eye, EyeOff, Zap, ExternalLink,
} from "lucide-react";

// ---------- Design tokens ----------
// paper: #F5F6F0 · panel: #FFFFFF · ink: #14161A · ink-soft: #6E7178
// accent (cobalt): #2B4CFF · flash (signature): #FFD400 · hairline: #E3E1D6

const TONES = [
  { id: "neutral", label: "Нейтральный", desc: "белый / серый, чисто", swatch: "linear-gradient(135deg,#FAFAF7,#E4E4DD)", prompt: "clean neutral white and light grey studio tones" },
  { id: "warm", label: "Тёплый", desc: "песочный, кремовый", swatch: "linear-gradient(135deg,#FBEFDD,#E8B98C)", prompt: "warm sandy, cream and caramel tones" },
  { id: "cool", label: "Холодный", desc: "голубой, стальной", swatch: "linear-gradient(135deg,#DCE6FF,#8FA6D6)", prompt: "cool steel-blue and ice tones" },
  { id: "pastel", label: "Пастель", desc: "мягкие приглушённые", swatch: "linear-gradient(135deg,#F6DDE8,#D6E8F6)", prompt: "soft muted pastel tones, pink and mint" },
  { id: "earthy", label: "Земляной", desc: "терракота, оливка", swatch: "linear-gradient(135deg,#E3C7A5,#8A7B5C)", prompt: "earthy terracotta, olive and clay tones" },
  { id: "mono", label: "Монохром", desc: "тёмный, контрастный", swatch: "linear-gradient(135deg,#3A3D45,#101114)", prompt: "moody monochrome charcoal and black tones, high contrast" },
  { id: "vibrant", label: "Яркий", desc: "насыщенные акценты", swatch: "linear-gradient(135deg,#FF8A65,#7C4DFF)", prompt: "vibrant saturated color-blocked tones" },
  { id: "mint", label: "Мятный", desc: "свежий, зелёный", swatch: "linear-gradient(135deg,#D8F3E3,#7FC9A0)", prompt: "fresh mint and sage green tones" },
];

const BACKDROPS = [
  { id: "studio", label: "Студийный фон", prompt: "seamless professional studio backdrop" },
  { id: "marble", label: "Мрамор", prompt: "polished marble surface" },
  { id: "wood", label: "Дерево", prompt: "natural wooden table surface" },
  { id: "fabric", label: "Ткань/шёлк", prompt: "draped silk fabric background" },
  { id: "nature", label: "Природа", prompt: "soft natural outdoor setting with foliage, blurred background" },
  { id: "urban", label: "Городской", prompt: "minimal urban concrete setting" },
  { id: "gradient", label: "Абстрактный градиент", prompt: "smooth abstract gradient background" },
  { id: "geometric", label: "Геометрия", prompt: "minimalist geometric shapes background" },
];

const LIGHTING = [
  { id: "soft", label: "Мягкий рассеянный", prompt: "soft diffused even lighting" },
  { id: "dramatic", label: "Драматичный боковой", prompt: "dramatic side lighting with defined shadows" },
  { id: "golden", label: "Золотой час", prompt: "warm golden-hour lighting" },
  { id: "softbox", label: "Софтбокс студийный", prompt: "bright studio softbox lighting, e-commerce style" },
  { id: "neon", label: "Неоновый акцент", prompt: "subtle neon rim-light accent" },
];

const COMPOSITIONS = [
  { id: "front", label: "Анфас по центру", prompt: "centered front-facing composition" },
  { id: "angle", label: "Ракурс 3/4", prompt: "three-quarter angle composition" },
  { id: "flatlay", label: "Флэтлей сверху", prompt: "top-down flat-lay composition" },
  { id: "closeup", label: "Крупный план", prompt: "close-up detail composition" },
];

const PLATFORMS = [
  { id: "square", label: "Квадрат 1:1", ratio: "1:1", w: 1024, h: 1024 },
  { id: "portrait", label: "Маркетплейс 4:5", ratio: "4:5", w: 1024, h: 1280 },
  { id: "story", label: "Сторис 9:16", ratio: "9:16", w: 1024, h: 1820 },
];

const BADGES = [
  { id: "none", label: "Без бейджа" },
  { id: "hit", label: "Хит продаж", color: "#2B4CFF" },
  { id: "sale", label: "Скидка", color: "#FF3B30" },
  { id: "new", label: "Новинка", color: "#00A868" },
  { id: "premium", label: "Premium", color: "#14161A" },
];

const MODEL = "gemini-2.5-flash-image";

function useGoogleFonts() {
  useEffect(() => {
    if (document.getElementById("card-studio-fonts")) return;
    const link = document.createElement("link");
    link.id = "card-studio-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
}

function buildPrompt({ tone, backdrop, lighting, composition }) {
  const t = TONES.find((x) => x.id === tone);
  const b = BACKDROPS.find((x) => x.id === backdrop);
  const l = LIGHTING.find((x) => x.id === lighting);
  const c = COMPOSITIONS.find((x) => x.id === composition);
  
  return `Turn this product photo into a professional, high-end e-commerce marketing image.  
  Keep the product itself completely unchanged — exact shape, proportions, color, logo, and texture must be preserved with full fidelity, do not distort, warp or reinterpret the product.  
  Place it in a ${b.prompt}, with ${l.prompt}, in ${t.prompt}. Use a ${c.prompt}.  
  Add a soft realistic contact shadow beneath the product so it looks physically grounded in the scene.  
  The result should look like a polished marketplace listing photo shot by a professional product photographer.  
  Do not add any text, price tags, watermarks or logos to the image — leave clean space near the edges for captions to be added separately.`;
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Вспомогательные функции для работы с Canvas и изображениями
async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(' ');
  let line = '';
  let lines = [];
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    ctx.fillText(lines[i], x, y + (i * lineHeight));
  }
}

// UI Компоненты, которых не хватало в исходном коде
function Section({ index, title, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ background: "#E3E1D6", color: "#6E7178", fontFamily: "IBM Plex Mono, monospace" }}>
          {index}
        </span>
        <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#14161A" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ButtonRow({ children }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all"
      style={{
        background: active ? "#14161A" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#14161A",
        border: `1px solid ${active ? "#14161A" : "#E3E1D6"}`,
        boxShadow: active ? "none" : "0 1px 2px rgba(20,22,26,0.03)"
      }}
    >
      {children}
    </button>
  );
}

async function generateWithGemini({ apiKey, base64, mimeType, prompt, aspectRatio }) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio },
        },
      }),
    }
  );

  if (!res.ok) {
    let detail = "";
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message || "";
    } catch {
      detail = await res.text();
    }
    if (res.status === 400 && /API key/i.test(detail)) throw new Error("Неверный API-ключ.");
    if (res.status === 403) throw new Error("Доступ запрещён — проверьте ключ и включён ли биллинг в Google AI Studio.");
    if (res.status === 429) throw new Error("Превышен лимит запросов — подождите немного и попробуйте снова.");
    throw new Error(detail || `Ошибка Gemini API (${res.status})`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find((p) => p.inlineData);
  if (!imgPart) {
    const blockReason = data?.promptFeedback?.blockReason;
    if (blockReason) throw new Error(`Запрос заблокирован модерацией (${blockReason}).`);
    throw new Error("Модель не вернула изображение. Попробуйте другой стиль.");
  }
  return `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
}

export default function CardStudio() {
  useGoogleFonts();

  const [photoFile, setPhotoFile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoImg, setPhotoImg] = useState(null);

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [tone, setTone] = useState("neutral");
  const [backdrop, setBackdrop] = useState("studio");
  const [lighting, setLighting] = useState("soft");
  const [composition, setComposition] = useState("front");
  const [platform, setPlatform] = useState("portrait");
  const [badge, setBadge] = useState("none");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  const [phase, setPhase] = useState("idle"); // idle | uploading-ai | compositing | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [resultUrl, setResultUrl] = useState(null);

  const canvasRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        if (window.storage) {
            const stored = await window.storage.get("gemini-api-key", false);
            if (stored?.value) setApiKey(stored.value);
        }
      } catch {
        // no stored key yet — fine
      } finally {
        setKeyLoaded(true);
      }
    })();
  }, []);

  const persistKey = async (val) => {
    setApiKey(val);
    try {
      if (window.storage) {
        await window.storage.set("gemini-api-key", val, false);
      }
    } catch {
      // best effort — key still works for this session even if save fails
    }
  };

  const onFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setPhotoImg(img);
      setPhoto(url);
      setPhotoFile(file);
      setResultUrl(null);
      setPhase("idle");
    };
    img.src = url;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    onFile(e.dataTransfer.files?.[0]);
  };

  const composite = useCallback(async (baseImage, platformCfg) => {
    const canvas = canvasRef.current;
    const W = platformCfg.w;
    const H = platformCfg.h;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // cover-fit the base (AI or local) image
    const scale = Math.max(W / baseImage.width, H / baseImage.height);
    const dw = baseImage.width * scale;
    const dh = baseImage.height * scale;
    ctx.drawImage(baseImage, (W - dw) / 2, (H - dh) / 2, dw, dh);

    const toneCfg = TONES.find((t) => t.id === tone);
    const dark = tone === "mono";
    const textColor = dark ? "#F5F6F0" : "#14161A";
    const softColor = dark ? "rgba(245,246,240,0.72)" : "rgba(20,22,26,0.6)";
    const m = Math.round(W * 0.045);

    await document.fonts.ready;

    // subtle bottom gradient so text stays legible over any scene
    if (title || price) {
      const grad = ctx.createLinearGradient(0, H * 0.72, 0, H);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, dark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.75)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, H * 0.72, W, H * 0.28);
    }

    // viewfinder corner brackets — signature element
    const bl = Math.round(W * 0.035);
    ctx.strokeStyle = dark ? "rgba(255,255,255,0.55)" : "rgba(20,22,26,0.5)";
    ctx.lineWidth = 2.5;
    const drawCorner = (x, y, hx, vy) => {
      ctx.beginPath();
      ctx.moveTo(x, y + bl * vy);
      ctx.lineTo(x, y);
      ctx.lineTo(x + bl * hx, y);
      ctx.stroke();
    };
    drawCorner(m, m, 1, 1);
    drawCorner(W - m, m, -1, 1);
    drawCorner(m, H - m, 1, -1);
    drawCorner(W - m, H - m, -1, -1);

    if (badge !== "none") {
      const b = BADGES.find((x) => x.id === badge);
      const fs = Math.round(W * 0.024);
      ctx.font = `700 ${fs}px Manrope`;
      const textW = ctx.measureText(b.label.toUpperCase()).width;
      const padX = fs;
      const bw = textW + padX * 2;
      const bh = fs * 2.1;
      const bx = m + 4;
      const by = m + 26;
      ctx.fillStyle = b.color;
      roundRect(ctx, bx, by, bw, bh, bh / 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textBaseline = "middle";
      ctx.fillText(b.label.toUpperCase(), bx + padX, by + bh / 2 + 1);
    }
    
    let ty = H - m - 8;
    if (price) {
      const fs = Math.round(W * 0.05);
      ctx.font = `600 ${fs}px Fraunces`;
      ctx.fillStyle = textColor;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(price, m, ty);
      ty -= fs * 1.25;
    }
    if (title) {
      const fs = Math.round(W * 0.032);
      ctx.font = `500 ${fs}px Manrope`;
      ctx.fillStyle = softColor;
      wrapText(ctx, title, m, ty, W - m * 2, fs * 1.25, 2);
    }

    ctx.font = `500 ${Math.round(W * 0.016)}px IBM Plex Mono`;
    ctx.fillStyle = softColor;
    ctx.textAlign = "right";
    ctx.fillText(`${toneCfg.label.toUpperCase()} · AI`, W - m, H - m - 8);

    return canvas.toDataURL("image/png");
  }, [tone, badge, title, price]);

  const generate = async () => {
    if (!photoImg || !photoFile) return;
    setErrorMsg("");
    setResultUrl(null);
    const platformCfg = PLATFORMS.find((p) => p.id === platform);

    try {
      let baseImage = photoImg;

      if (apiKey.trim()) {
        setPhase("uploading-ai");
        const base64 = await fileToBase64(photoFile);
        const prompt = buildPrompt({ tone, backdrop, lighting, composition });
        const dataUrl = await generateWithGemini({
          apiKey: apiKey.trim(),
          base64,
          mimeType: photoFile.type || "image/jpeg",
          prompt,
          aspectRatio: platformCfg.ratio,
        });
        const aiImg = await loadImage(dataUrl);
        baseImage = aiImg;
      }

      setPhase("compositing");
      const finalUrl = await composite(baseImage, platformCfg);
      setResultUrl(finalUrl);
      setPhase("done");
    } catch (err) {
      setErrorMsg(err.message || "Не удалось сгенерировать карточку.");
      setPhase("error");
    }
  };

  const reset = () => {
    setPhoto(null);
    setPhotoImg(null);
    setPhotoFile(null);
    setResultUrl(null);
    setTitle("");
    setPrice("");
    setBadge("none");
    setPhase("idle");
    setErrorMsg("");
  };

  const busy = phase === "uploading-ai" || phase === "compositing";

  return (
    <div style={{ fontFamily: "Manrope, sans-serif", background: "#F5F6F0", color: "#14161A" }} className="min-h-screen w-full">
      <canvas ref={canvasRef} className="hidden" />

      <header className="border-b" style={{ borderColor: "#E3E1D6" }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#14161A" }}>
              <Aperture size={16} color="#FFD400" strokeWidth={2.2} />
            </div>
            <span style={{ fontFamily: "Fraunces, serif" }} className="text-lg font-medium tracking-tight">Карточка</span>
          </div>
          <div
            className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
            style={{ background: "#FFFFFF", border: "1px solid #E3E1D6", color: "#6E7178", fontFamily: "IBM Plex Mono, monospace" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: apiKey ? "#00A868" : "#D8D6C9" }} />
            {apiKey ? "GEMINI ПОДКЛЮЧЁН" : "ЛОКАЛЬНЫЙ РЕЖИМ"}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-[400px_1fr] gap-8">
        <div className="space-y-8">
          <div>
            <h1 style={{ fontFamily: "Fraunces, serif" }} className="text-[2rem] leading-[1.1] font-medium tracking-tight mb-2">
              Из фото — в карточку
            </h1>
            <p style={{ color: "#6E7178" }} className="text-[15px] leading-relaxed">
              Загрузите фото товара, настройте сцену — Gemini перерисует окружение, сохранив сам товар без изменений.
            </p>
          </div>
          
          <Section index="01" title="Gemini API-ключ">
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => persistKey(e.target.value)}
                placeholder="Вставьте ключ из Google AI Studio"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg text-sm outline-none"
                style={{ border: "1px solid #E3E1D6", background: "#FFFFFF", fontFamily: "IBM Plex Mono, monospace" }}
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#6E7178" }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs flex items-center gap-1"
                style={{ color: "#2B4CFF" }}
              >
                Получить ключ <ExternalLink size={11} />
              </a>
              <span className="text-xs" style={{ color: "#6E7178" }}>Хранится только у вас</span>
            </div>
            {!apiKey && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: "#6E7178" }}>
                Без ключа карточка соберётся локально — фото + оформление, без AI-перерисовки сцены.
              </p>
            )}
          </Section>

          <Section index="02" title="Фото товара">
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="relative rounded-2xl border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 py-8 text-center"
              style={{ borderColor: photo ? "#2B4CFF" : "#D8D6C9", background: "#FFFFFF" }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onFile(e.target.files?.[0])}
                style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
              />
              {photo ? (
                <img src={photo} alt="товар" className="h-24 rounded-lg object-contain" />
              ) : (
                <>
                  <Upload size={22} color="#6E7178" />
                  <span className="text-sm font-medium">Перетащите фото сюда</span>
                  <span className="text-xs" style={{ color: "#6E7178" }}>или нажмите, чтобы выбрать файл</span>
                </>
              )}
            </label>
          </Section>

          <Section index="03" title="Формат">
            <ButtonRow>
              {PLATFORMS.map((p) => (
                <Pill key={p.id} active={platform === p.id} onClick={() => setPlatform(p.id)}>{p.label}</Pill>
              ))}
            </ButtonRow>
          </Section>

          <Section index="04" title="Цветовой тон">
            <div className="grid grid-cols-2 gap-2.5">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className="rounded-xl overflow-hidden text-left transition-all flex flex-col"
                  style={{ border: tone === t.id ? "2px solid #2B4CFF" : "2px solid transparent", boxShadow: "0 1px 2px rgba(20,22,26,0.06)" }}
                >
                  <div style={{ background: t.swatch, height: 40 }} className="w-full" />
                  <div className="px-3 py-2 bg-white flex flex-col gap-0.5 flex-1 w-full">
                    <div className="text-[12px] font-semibold flex items-center justify-between">
                      {t.label}
                      {tone === t.id && <Check size={14} color="#2B4CFF" />}
                    </div>
                    <div style={{ color: "#6E7178" }} className="text-[10px] leading-tight">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </Section>

          <Section index="05" title="Фон / сцена">
            <ButtonRow>
              {BACKDROPS.map((b) => (
                <Pill key={b.id} active={backdrop === b.id} onClick={() => setBackdrop(b.id)}>{b.label}</Pill>
              ))}
            </ButtonRow>
          </Section>

          {/* Завершённая разметка */}
          <Section index="06" title="Освещение">
            <ButtonRow>
              {LIGHTING.map((l) => (
                <Pill key={l.id} active={lighting === l.id} onClick={() => setLighting(l.id)}>{l.label}</Pill>
              ))}
            </ButtonRow>
          </Section>

          <Section index="07" title="Композиция">
            <ButtonRow>
              {COMPOSITIONS.map((c) => (
                <Pill key={c.id} active={composition === c.id} onClick={() => setComposition(c.id)}>{c.label}</Pill>
              ))}
            </ButtonRow>
          </Section>

          <Section index="08" title="Бейдж и Текст">
            <div className="space-y-4">
              <ButtonRow>
                {BADGES.map((bg) => (
                  <Pill key={bg.id} active={badge === bg.id} onClick={() => setBadge(bg.id)}>{bg.label}</Pill>
                ))}
              </ButtonRow>
              <div className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Заголовок товара (например, Сыворотка для лица)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid #E3E1D6", background: "#FFFFFF" }}
                />
                <input
                  type="text"
                  placeholder="Цена (например, 1 299 ₽)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid #E3E1D6", background: "#FFFFFF" }}
                />
              </div>
            </div>
          </Section>

          <button
            onClick={generate}
            disabled={busy || !photo}
            className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-opacity"
            style={{ background: "#2B4CFF", opacity: (busy || !photo) ? 0.5 : 1 }}
          >
            {busy ? (
              <><Loader2 size={18} className="animate-spin" /> Генерация...</>
            ) : (
              <><Sparkles size={18} /> Создать карточку</>
            )}
          </button>
        </div>

        {/* Правая панель с результатом */}
        <div className="h-fit sticky top-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm border flex flex-col gap-4" style={{ borderColor: "#E3E1D6" }}>
            <div
              className="w-full bg-gray-50 rounded-xl border border-dashed flex items-center justify-center relative overflow-hidden"
              style={{ borderColor: "#E3E1D6", aspectRatio: PLATFORMS.find((p) => p.id === platform).ratio.replace(':', '/') }}
            >
              {resultUrl ? (
                <img src={resultUrl} alt="Результат" className="w-full h-full object-contain" />
              ) : photo ? (
                <img src={photo} alt="Оригинал" className="w-full h-full object-contain opacity-40 blur-sm" />
              ) : (
                <div className="text-center text-gray-400 flex flex-col items-center gap-2">
                  <ImageIcon size={32} strokeWidth={1.5} />
                  <span className="text-sm font-medium">Предпросмотр</span>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex gap-2 items-start leading-relaxed">
                <AlertCircle size={16} className="mt-0.5 shrink-0" /> 
                <span>{errorMsg}</span>
              </div>
            )}

            {resultUrl && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = resultUrl;
                    a.download = "product-card.png";
                    a.click();
                  }}
                  className="flex-1 py-3 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  style={{ background: "#14161A" }}
                >
                  <Download size={16} /> Скачать
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors"
                  style={{ background: "#F5F6F0", color: "#14161A" }}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}