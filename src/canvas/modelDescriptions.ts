import { getActiveLocale } from "../i18n/messages.ts";

const MINIMAX_DESCRIPTIONS: Record<string, string> = {
  "MiniMax-H3": "高品质视频创作",
  "MiniMax-H3-Highspeed": "兼顾生成质量与速度",
  "MiniMax-H3-Lite": "轻量版本",
  "MiniMax-H3-Max": "极速生成",
};

const EN_MINIMAX_DESCRIPTIONS: Record<string, string> = {
  "MiniMax-H3": "Premium video creation",
  "MiniMax-H3-Highspeed": "Balanced quality and speed",
  "MiniMax-H3-Lite": "Lightweight version",
  "MiniMax-H3-Max": "Fast generation",
};

const PT_MINIMAX_DESCRIPTIONS: Record<string, string> = {
  "MiniMax-H3": "Criação de vídeos em alta qualidade",
  "MiniMax-H3-Highspeed": "Equilíbrio entre qualidade e velocidade",
  "MiniMax-H3-Lite": "Versão leve",
  "MiniMax-H3-Max": "Geração rápida",
};

export function modelDescription(model: { protocol?: string | null; modelId: string }) {
  if (model.protocol === "kling_video" && model.modelId === "kling-4.0-flash")
    return getActiveLocale() === "pt-BR"
      ? "Vídeo 720p por texto, quadro inicial ou imagem de referência, 3–20 segundos, com áudio nativo"
      : getActiveLocale() === "en-US"
        ? "720P text, first-frame and image-reference video, 3–20 seconds, native audio"
        : "720P 文生、首帧与图片参考，3–20 秒，包含原生音频";
  if (model.protocol === "kling_video" && model.modelId === "kling-4.0")
    return getActiveLocale() === "pt-BR"
      ? "Texto, quadros inicial/final e imagens de referência com áudio nativo"
      : getActiveLocale() === "en-US"
        ? "Text, first/last frames and image references with native audio"
        : "文生、首尾帧与图片参考，包含原生音频";
  if (model.protocol !== "minimax_video_v2") return undefined;
  const source =
    getActiveLocale() === "pt-BR"
      ? PT_MINIMAX_DESCRIPTIONS
      : getActiveLocale() === "en-US"
        ? EN_MINIMAX_DESCRIPTIONS
        : MINIMAX_DESCRIPTIONS;
  return source[model.modelId];
}
