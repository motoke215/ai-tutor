import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, Sun, Moon, Settings, ChevronLeft, Send, ChevronDown, X, Key, Globe } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL PROVIDERS — 通用API接口配置
// ═══════════════════════════════════════════════════════════════════════════════
const MODEL_PROVIDERS = {
  deepseek: {
    name: "DeepSeek",
    icon: "🔵",
    color: "#346cla", // DeepSeek蓝
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat", desc: "通用对话模型" },
      { id: "deepseek-coder", name: "DeepSeek Coder", desc: "代码专用模型" },
    ],
  },
  minimax: {
    name: "MiniMax",
    icon: "🟠",
    color: "#ff6b35",
    baseUrl: "https://api.minimax.chat/v1",
    defaultModel: "abab6.5s",
    models: [
      // 文本模型
      { id: "abab6.5s", name: "ABAB6.5s", desc: "245k上下文 · 通用场景", type: "text" },
      { id: "abab6.5t", name: "ABAB6.5t", desc: "8k上下文 · AI陪伴", type: "text" },
      { id: "abab6.5g", name: "ABAB6.5g", desc: "8k上下文 · 英文陪伴", type: "text" },
      { id: "abab7-preview", name: "ABAB7 Preview", desc: "最新旗舰 · 性能大幅提升", type: "text" },
      { id: "abab5.5-chat-240123", name: "ABAB5.5 Chat", desc: "微调版 · 240123", type: "text" },
      { id: "abab5.5s-chat-240119", name: "ABAB5.5s Chat", desc: "轻量微调版", type: "text" },
      // 语音模型
      { id: "speech-01", name: "Speech-01", desc: "超自然语音生成", type: "audio" },
      { id: "speech-01-240228", name: "Speech-01 (稳定)", desc: "稳定版语音", type: "audio" },
      // 视频模型
      { id: "video-01", name: "Video-01", desc: "文生视频/图生视频", type: "video" },
      { id: "abab-video-1", name: "ABAB-Video-1", desc: "视频生成", type: "video" },
      // 音乐模型
      { id: "music-01", name: "Music-01", desc: "AI音乐生成", type: "music" },
      { id: "music-2.5", name: "Music-2.5", desc: "AI原创音乐", type: "music" },
    ],
  },
  siliconflow: {
    name: "硅基流动",
    icon: "💧",
    color: "#00d4aa",
    baseUrl: "https://api.siliconflow.cn/v1",
    defaultModel: "Qwen/Qwen2.5-7B-Instruct",
    models: [
      // Qwen系列
      { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen2.5-72B", desc: "旗舰模型", series: "Qwen" },
      { id: "Qwen/Qwen2.5-14B-Instruct", name: "Qwen2.5-14B", desc: "更强推理", series: "Qwen" },
      { id: "Qwen/Qwen2.5-7B-Instruct", name: "Qwen2.5-7B", desc: "通识对话", series: "Qwen" },
      { id: "Qwen/Qwen2-72B-Instruct", name: "Qwen2-72B", desc: "上一代72B", series: "Qwen" },
      { id: "Qwen/Qwen2-14B-Instruct", name: "Qwen2-14B", desc: "上一代14B", series: "Qwen" },
      { id: "Qwen/Qwen2-7B-Instruct", name: "Qwen2-7B", desc: "上一代7B", series: "Qwen" },
      // GLM系列
      { id: "THUDM/glm-4-72b-chat", name: "GLM-4-72B", desc: "智谱4代72B", series: "GLM" },
      { id: "THUDM/glm-4-9b-chat", name: "GLM-4-9B", desc: "智谱4代9B", series: "GLM" },
      { id: "THUDM/glm-4v-9b-chat", name: "GLM-4V-9B", desc: "智谱4代视觉", series: "GLM" },
      // DeepSeek系列
      { id: "deepseek-ai/DeepSeek-V2.5", name: "DeepSeek-V2.5", desc: "最新融合模型", series: "DeepSeek" },
      { id: "deepseek-ai/DeepSeek-V2", name: "DeepSeek-V2", desc: "DeepSeek V2", series: "DeepSeek" },
      // Llama系列
      { id: "meta-llama/Llama-3.1-70B-Instruct", name: "Llama-3.1-70B", desc: "Meta 3.1 70B", series: "Llama" },
      { id: "meta-llama/Llama-3.1-8B-Instruct", name: "Llama-3.1-8B", desc: "Meta 3.1 8B", series: "Llama" },
      { id: "meta-llama/Llama-3-70B-Instruct", name: "Llama-3-70B", desc: "Meta 3 70B", series: "Llama" },
      { id: "meta-llama/Llama-3-8B-Instruct", name: "Llama-3-8B", desc: "Meta 3 8B", series: "Llama" },
      // Mistral系列
      { id: "mistralai/Mixtral-8x22B-Instruct-v0.1", name: "Mixtral-8x22B", desc: "专家混合模型", series: "Mistral" },
      { id: "mistralai/Mistral-7B-Instruct-v0.3", name: "Mistral-7B-v0.3", desc: "Mistral 7B", series: "Mistral" },
      // 其他
      { id: "microsoft/WizardLM-2-8x22B", name: "WizardLM-2-8x22B", desc: "微软Wizard", series: "其他" },
      { id: "01-ai/Yi-1.5-34B-Chat", name: "Yi-1.5-34B", desc: "零一万物34B", series: "其他" },
      { id: "01-ai/Yi-1.5-9B-Chat", name: "Yi-1.5-9B", desc: "零一万物9B", series: "其他" },
      { id: "internlm/internlm2_5-20b-chat", name: "InternLM2.5-20B", desc: "书生浦语20B", series: "其他" },
      { id: "internlm/internlm2_5-7b-chat", name: "InternLM2.5-7B", desc: "书生浦语7B", series: "其他" },
      { id: "baichuan-inc/Baichuan4", name: "Baichuan-4", desc: "百川4代", series: "其他" },
      { id: "baichuan-inc/Baichuan3-Turbo", name: "Baichuan3-Turbo", desc: "百川3 turbo", series: "其他" },
    ],
  },
  openai: {
    name: "OpenAI",
    icon: "⚫",
    color: "#10a37f",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    models: [
      { id: "gpt-4o", name: "GPT-4o", desc: "最新旗舰", series: "GPT-4" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", desc: "轻量快速", series: "GPT-4" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", desc: "Turbo版", series: "GPT-4" },
      { id: "gpt-4", name: "GPT-4", desc: "标准版", series: "GPT-4" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", desc: "经典模型", series: "GPT-3.5" },
    ],
  },
  azure: {
    name: "Azure OpenAI",
    icon: "☁️",
    color: "#0078d4",
    baseUrl: "", // 用户需要自定义
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", name: "GPT-4o", desc: "最新旗舰" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", desc: "轻量快速" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", desc: "Turbo版" },
      { id: "gpt-35-turbo", name: "GPT-3.5 Turbo", desc: "经典模型" },
    ],
  },
  gemini: {
    name: "Google Gemini",
    icon: "🟢",
    color: "#4285f4",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-1.5-flash",
    models: [
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", desc: "专业版", series: "Gemini 1.5" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", desc: "快速版", series: "Gemini 1.5" },
      { id: "gemini-1.5-flash-latest", name: "Gemini 1.5 Flash (最新)", desc: "最新快速版", series: "Gemini 1.5" },
      { id: "gemini-1.0-pro", name: "Gemini 1.0 Pro", desc: "标准版", series: "Gemini 1.0" },
      { id: "gemini-1.0-pro-latest", name: "Gemini 1.0 Pro (最新)", desc: "最新标准版", series: "Gemini 1.0" },
    ],
  },
  ollama: {
    name: "Ollama 本地",
    icon: "🦙",
    color: "#f97316",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.1",
    models: [
      { id: "llama3.1", name: "Llama 3.1", desc: "Meta 3.1" },
      { id: "llama3", name: "Llama 3", desc: "Meta 3" },
      { id: "qwen2.5", name: "Qwen 2.5", desc: "通义千问" },
      { id: "codellama", name: "CodeLlama", desc: "代码专用" },
      { id: "mistral", name: "Mistral", desc: "Mistral 7B" },
      { id: "deepseek-coder", name: "DeepSeek Coder", desc: "代码模型" },
    ],
  },
};

// 获取provider列表（不含ollama）
const CLOUD_PROVIDERS = Object.entries(MODEL_PROVIDERS)
  .filter(([k]) => k !== "ollama")
  .map(([k, v]) => ({ id: k, ...v }));

// ═══════════════════════════════════════════════════════════════════════════════
// THEME SYSTEM — 4 visual styles
// ═══════════════════════════════════════════════════════════════════════════════
const THEMES = {
  amber: {
    id: "amber", name: "暗夜琥珀", icon: "🌙",
    bg: "#0f0d0a", surface: "#1a1612", card: "#211d18", border: "#2e2820",
    accent: "#f0a500", accentDim: "#c47f00", accentGlow: "rgba(240,165,0,0.15)",
    text: "#f5ede0", textDim: "#a89880", textMuted: "#6b5e50",
    userBubble: "linear-gradient(135deg, #f0a500, #c47f00)",
    userText: "#0f0d0a",
    headerBg: "rgba(15,13,10,0.88)",
    inputBg: "#211d18",
    orb1: "rgba(240,165,0,0.07)", orb2: "rgba(240,100,0,0.04)",
  },
  scholar: {
    id: "scholar", name: "白日书院", icon: "☀️",
    bg: "#faf7f2", surface: "#f2ede4", card: "#ffffff", border: "#e8ddd0",
    accent: "#8b5e3c", accentDim: "#6b4228", accentGlow: "rgba(139,94,60,0.12)",
    text: "#2d1f14", textDim: "#7a5c44", textMuted: "#b8997d",
    userBubble: "linear-gradient(135deg, #8b5e3c, #6b4228)",
    userText: "#ffffff",
    headerBg: "rgba(250,247,242,0.92)",
    inputBg: "#f8f4ee",
    orb1: "rgba(139,94,60,0.06)", orb2: "rgba(200,150,80,0.04)",
  },
  ocean: {
    id: "ocean", name: "深海墨水", icon: "🌊",
    bg: "#060d1a", surface: "#0c1628", card: "#101e35", border: "#1a2d4a",
    accent: "#38bdf8", accentDim: "#0ea5e9", accentGlow: "rgba(56,189,248,0.15)",
    text: "#e0f0ff", textDim: "#7eaed4", textMuted: "#4a7090",
    userBubble: "linear-gradient(135deg, #38bdf8, #0284c7)",
    userText: "#060d1a",
    headerBg: "rgba(6,13,26,0.90)",
    inputBg: "#101e35",
    orb1: "rgba(56,189,248,0.07)", orb2: "rgba(6,182,212,0.04)",
  },
  bamboo: {
    id: "bamboo", name: "竹林清风", icon: "🎋",
    bg: "#080f0a", surface: "#0e1810", card: "#132014", border: "#1d3020",
    accent: "#6ee7b7", accentDim: "#34d399", accentGlow: "rgba(110,231,183,0.14)",
    text: "#e8f5ee", textDim: "#7fbf9c", textMuted: "#4a7a5a",
    userBubble: "linear-gradient(135deg, #6ee7b7, #10b981)",
    userText: "#080f0a",
    headerBg: "rgba(8,15,10,0.90)",
    inputBg: "#132014",
    orb1: "rgba(110,231,183,0.07)", orb2: "rgba(52,211,153,0.04)",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEACHER PERSONAS — matched by subject keywords
// ═══════════════════════════════════════════════════════════════════════════════
const TEACHERS = [
  {
    keys: ["python","javascript","js","编程","代码","code","react","vue","算法","数据结构","typescript","java","c++","rust","go","swift"],
    name: "Alex", title: "编程教练", avatar: "A", lang: "zh-CN",
    style: "你是一个酷炫的硅谷风技术教练，用简洁的比喻解释技术概念，偶尔用英文术语，风格直接犀利",
  },
  {
    keys: ["english","英语","法语","日语","韩语","spanish","german","外语","语言","口语","写作","雅思","托福","gre"],
    name: "Sarah", title: "外语老师", avatar: "S", lang: "en-US",
    style: "You are a warm and encouraging language teacher. Mix Chinese explanations with target language practice. Always correct mistakes kindly and make students speak",
  },
  {
    keys: ["数学","math","几何","代数","微积分","概率","统计","物理","化学","力学","热力学","电磁"],
    name: "王老师", title: "理科导师", avatar: "王", lang: "zh-CN",
    style: "你是严谨但风趣的理科老师，善用生活中的实例解释抽象公式，坚持先问后讲，不放过任何逻辑漏洞",
  },
  {
    keys: ["历史","文学","语文","哲学","政治","地理","人文","诗词","古文","文化","伦理","逻辑"],
    name: "陈老师", title: "文科导师", avatar: "陈", lang: "zh-CN",
    style: "你是儒雅渊博的文科老师，善于用故事和背景知识引导学生，提问充满思辨性，总能把知识讲活",
  },
  {
    keys: ["经济","金融","商业","管理","市场","会计","投资","股票","企业","创业","营销","战略"],
    name: "李老师", title: "商科导师", avatar: "李", lang: "zh-CN",
    style: "你是思维敏锐的商科导师，用案例教学法，总是先问学生对商业世界的直觉判断，然后引导深入",
  },
  {
    keys: ["生物","医学","健康","心理","神经","解剖","遗传","生态","营养","中医","药学"],
    name: "林老师", title: "生命科学导师", avatar: "林", lang: "zh-CN",
    style: "你是温柔细心的生命科学老师，把复杂的生物概念类比到日常生活，特别注重理解而非死记",
  },
];

const DEFAULT_TEACHER = {
  name: "孔老师", title: "博学导师", avatar: "孔", lang: "zh-CN",
  style: "你是一位博学通才的导师，善于从多角度切入任何知识领域，因材施教，充满耐心",
};

function getTeacher(subject) {
  if (!subject) return DEFAULT_TEACHER;
  const lower = subject.toLowerCase();
  return TEACHERS.find(t => t.keys.some(k => lower.includes(k))) || DEFAULT_TEACHER;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL CONFIG PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function ModelConfigPanel({ T, selectedProvider, setSelectedProvider, selectedModel, setSelectedModel, apiKeys, setApiKeys, customBaseUrl, setCustomBaseUrl, showModelDropdown, setShowModelDropdown, onClose }) {
  const provider = MODEL_PROVIDERS[selectedProvider];

  const handleProviderChange = (providerId) => {
    setSelectedProvider(providerId);
    const p = MODEL_PROVIDERS[providerId];
    setSelectedModel(p.defaultModel);
  };

  const handleApiKeyChange = (val) => {
    setApiKeys(prev => ({ ...prev, [selectedProvider]: val }));
  };

  const handleBaseUrlChange = (val) => {
    setCustomBaseUrl(prev => ({ ...prev, [selectedProvider]: val }));
  };

  const getDisplayUrl = () => {
    const url = customBaseUrl[selectedProvider] || provider.baseUrl;
    return url ? `${url}/chat/completions` : "（需填写自定义URL）";
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
        width: "100%", maxWidth: 520, maxHeight: "85vh", overflow: "hidden",
        display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚙️</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: T.text }}>模型配置</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20, padding: 4 }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Provider Selection */}
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", marginBottom: 8 }}>
              选择服务商
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {CLOUD_PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  style={{
                    background: selectedProvider === p.id ? `${p.color}22` : T.surface,
                    border: `1.5px solid ${selectedProvider === p.id ? p.color : T.border}`,
                    borderRadius: 10, padding: "10px 8px", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: selectedProvider === p.id ? p.color : T.text }}>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", marginBottom: 8 }}>
              选择模型
            </div>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowModelDropdown(prev => ({ ...prev, [selectedProvider]: !prev[selectedProvider] }))}
                style={{
                  width: "100%", background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  color: T.text, fontSize: 14,
                }}
              >
                <span>
                  {provider.models.find(m => m.id === selectedModel)?.name || selectedModel}
                  {" "}
                  <span style={{ fontSize: 11, color: T.textMuted }}>
                    ({provider.models.find(m => m.id === selectedModel)?.type === "text" ? "📝" :
                      provider.models.find(m => m.id === selectedModel)?.type === "audio" ? "🎙" :
                      provider.models.find(m => m.id === selectedModel)?.type === "video" ? "🎬" :
                      provider.models.find(m => m.id === selectedModel)?.type === "music" ? "🎵" :
                      provider.models.find(m => m.id === selectedModel)?.series || "通用"})
                  </span>
                </span>
                <ChevronDown size={16} color={T.textMuted} />
              </button>

              {showModelDropdown[selectedProvider] && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
                  maxHeight: 360, overflow: "auto", zIndex: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                }}>
                  {/* MiniMax: 按类型分组（text/audio/video/music） */}
                  {selectedProvider === "minimax" && ["text", "audio", "video", "music"].map(type => {
                    const typeModels = provider.models.filter(m => m.type === type);
                    if (typeModels.length === 0) return null;
                    return (
                      <div key={type}>
                        <div style={{ padding: "8px 14px 4px", fontSize: 10, color: T.textMuted, fontFamily: "monospace", textTransform: "uppercase", background: T.surface, position: "sticky", top: 0 }}>
                          {type === "text" ? "📝 文本模型" : type === "audio" ? "🎙 语音模型" : type === "video" ? "🎬 视频模型" : "🎵 音乐模型"}
                        </div>
                        {typeModels.map(m => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedModel(m.id);
                              setShowModelDropdown(prev => ({ ...prev, [selectedProvider]: false }));
                            }}
                            style={{
                              width: "100%", background: selectedModel === m.id ? T.accentGlow : "none",
                              border: "none", padding: "10px 14px", cursor: "pointer",
                              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                              borderBottom: `1px solid ${T.border}50`,
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 500, color: selectedModel === m.id ? T.accent : T.text }}>{m.name}</span>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{m.desc}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}

                  {/* 有 series 字段的 Provider: 按系列分组（硅基流动/OpenAI/Gemini等） */}
                  {selectedProvider !== "minimax" && provider.models.some(m => m.series) && (() => {
                    const series = [...new Set(provider.models.map(m => m.series || "其他"))];
                    return series.map(s => {
                      const seriesModels = provider.models.filter(m => (m.series || "其他") === s);
                      return (
                        <div key={s}>
                          <div style={{ padding: "8px 14px 4px", fontSize: 10, color: T.textMuted, fontFamily: "monospace", textTransform: "uppercase", background: T.surface, position: "sticky", top: 0 }}>
                            💎 {s} 系列
                          </div>
                          {seriesModels.map(m => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setSelectedModel(m.id);
                                setShowModelDropdown(prev => ({ ...prev, [selectedProvider]: false }));
                              }}
                              style={{
                                width: "100%", background: selectedModel === m.id ? T.accentGlow : "none",
                                border: "none", padding: "10px 14px", cursor: "pointer",
                                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                                borderBottom: `1px solid ${T.border}50`,
                              }}
                            >
                              <span style={{ fontSize: 13, fontWeight: 500, color: selectedModel === m.id ? T.accent : T.text }}>{m.name}</span>
                              <span style={{ fontSize: 11, color: T.textMuted }}>{m.desc}</span>
                            </button>
                          ))}
                        </div>
                      );
                    });
                  })()}

                  {/* 无 series 的 Provider: 扁平列表（Ollama等） */}
                  {selectedProvider !== "minimax" && !provider.models.some(m => m.series) && provider.models.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m.id);
                        setShowModelDropdown(prev => ({ ...prev, [selectedProvider]: false }));
                      }}
                      style={{
                        width: "100%", background: selectedModel === m.id ? T.accentGlow : "none",
                        border: "none", padding: "10px 14px", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                        borderBottom: `1px solid ${T.border}50`,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500, color: selectedModel === m.id ? T.accent : T.text }}>{m.name}</span>
                      <span style={{ fontSize: 11, color: T.textMuted }}>{m.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* API Key */}
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", marginBottom: 8 }}>
              <Key size={10} style={{ display: "inline", marginRight: 4 }} />
              API Key
            </div>
            <input
              type="password"
              value={apiKeys[selectedProvider] || ""}
              onChange={e => handleApiKeyChange(e.target.value)}
              placeholder={`输入 ${provider.name} 的 API Key`}
              style={{
                width: "100%", background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: "10px 14px", color: T.text, fontSize: 13,
                fontFamily: "monospace",
              }}
            />
          </div>

          {/* Custom Base URL (for Azure/Ollama) */}
          {selectedProvider === "azure" || selectedProvider === "ollama" && (
            <div>
              <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", marginBottom: 8 }}>
                <Globe size={10} style={{ display: "inline", marginRight: 4 }} />
                API 地址
              </div>
              <input
                type="text"
                value={customBaseUrl[selectedProvider] || ""}
                onChange={e => handleBaseUrlChange(e.target.value)}
                placeholder={provider.baseUrl || "https://..."}
                style={{
                  width: "100%", background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 10, padding: "10px 14px", color: T.text, fontSize: 13,
                }}
              />
            </div>
          )}

          {/* Generated URL Preview */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, fontFamily: "monospace" }}>请求地址</div>
            <div style={{ fontSize: 12, color: T.accent, fontFamily: "monospace", wordBreak: "break-all" }}>
              {getDisplayUrl()}
            </div>
          </div>

          {/* Model info */}
          <div style={{ background: T.accentGlow, border: `1px solid ${T.accent}33`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, color: T.text, marginBottom: 4 }}>
              <strong>当前模型：</strong>{provider.models.find(m => m.id === selectedModel)?.name}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted }}>
              {provider.models.find(m => m.id === selectedModel)?.desc}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentDim})`,
              border: "none", borderRadius: 8, padding: "10px 24px",
              color: T.userText, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            保存并关闭
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MASTERY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const masteryColor = (v) => {
  if (v < 30) return "#f87171";
  if (v < 60) return "#fb923c";
  if (v < 80) return "#facc15";
  return "#4ade80";
};
const masteryLabel = (v) => {
  if (v < 20) return ["继续加油", "💪"];
  if (v < 50) return ["初见端倪", "🌱"];
  if (v < 70) return ["逐渐清晰", "🔥"];
  if (v < 90) return ["快要掌握", "⚡"];
  return ["已经掌握", "✨"];
};

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════
function buildSystem(subject, level, goal, teacher) {
  return `${teacher.style}

你正在辅导学生学习「${subject}」，学生水平：${level}，目标：${goal || "全面掌握"}。

【苏格拉底教学原则】
1. 永不直接给答案——先问学生已知什么，找到知识漏洞
2. 用问题引导学生自己推导出答案
3. 掌握率<80%时绝不推进新知识点，坚守一个点直到真正理解
4. 学生卡壳时：换比喻、换例子、换角度，最多换三次
5. 每3-4轮必须做一次小测验，主动验证理解（不是听懂了，是会用）
6. 回复必须简洁有力，≤120字，像真正在面对面讲课

【掌握率规则】
- 学生主动推导出正确答案 → +15~20
- 学生答对但是靠猜 → +5~8
- 学生部分理解 → +3~6
- 学生答错/不懂 → -5~10
- 学生说"懂了"但无法举例 → -3

【严格按JSON格式回复，不输出任何额外文字】:
{
  "message": "你的教学内容（\\n分隔段落）",
  "masteryDelta": 整数,
  "currentMastery": 0-100整数,
  "mode": "explore|explain|test|praise|redirect|milestone之一",
  "suggestedResponses": ["选项1","选项2","选项3"],
  "insight": "一句话描述学生理解状态"
}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MASTERY RING
// ═══════════════════════════════════════════════════════════════════════════════
function MasteryRing({ value, accent }) {
  const r = 26, c = 32, stroke = 5;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const col = masteryColor(value);
  return (
    <svg width={64} height={64}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(128,128,128,0.2)" strokeWidth={stroke} />
      <circle
        cx={c} cy={c} r={r} fill="none"
        stroke={col} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: "stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)", filter: `drop-shadow(0 0 5px ${col})` }}
      />
      <text x={c} y={c + 5} textAnchor="middle" fill={col} fontSize={12} fontWeight={700} fontFamily="monospace">{value}%</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPING DOTS
// ═══════════════════════════════════════════════════════════════════════════════
function TypingDots({ T, teacher }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.accentGlow, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: T.accent, fontWeight: 700, flexShrink: 0 }}>
        {teacher.avatar}
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "4px 18px 18px 18px", padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.accent, animation: `dotBounce 1.2s ${i*0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [themeId, setThemeId] = useState("amber");
  const T = THEMES[themeId];

  const [phase, setPhase] = useState("onboard");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("初学者");
  const [goal, setGoal] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiHistory, setApiHistory] = useState([]);
  const [teacher, setTeacher] = useState(DEFAULT_TEACHER);

  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const [showThemes, setShowThemes] = useState(false);
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [sessionStats, setSessionStats] = useState({ turns: 0, startTime: null });

  // Model config state — load from localStorage for persistence
  const [selectedProvider, setSelectedProvider] = useState(() => localStorage.getItem("aitutor_provider") || "deepseek");
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem("aitutor_model") || "deepseek-chat");
  const [showModelDropdown, setShowModelDropdown] = useState({});
  const [lastInputWasVoice, setLastInputWasVoice] = useState(false);

  // ── Multi-user system ─────────────────────────────────────────────────
  const [users, setUsers] = useState(() => {
    try { const u = JSON.parse(localStorage.getItem("aitutor_users") || "[]"); return u.length ? u : [{ id: "default", name: "我", avatar: "👤", createdAt: Date.now(), topicMastery: {}, sessionHistory: [] }]; }
    catch { return [{ id: "default", name: "我", avatar: "👤", createdAt: Date.now(), topicMastery: {}, sessionHistory: [] }]; }
  });
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem("aitutor_uid") || "default");
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [showNewUser, setShowNewUser] = useState(false);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];
  const topicMastery = currentUser?.topicMastery || {};
  const mastery = topicMastery[teacher.name] || 0;

  // Update mastery for current topic
  const updateMastery = useCallback((delta) => {
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.id !== currentUserId) return u;
        const prevMastery = u.topicMastery[teacher.name] || 0;
        const newMastery = Math.min(100, Math.max(0, prevMastery + delta));
        return { ...u, topicMastery: { ...u.topicMastery, [teacher.name]: newMastery } };
      });
      localStorage.setItem("aitutor_users", JSON.stringify(updated));
      return updated;
    });
  }, [currentUserId, teacher.name]);

  // Record session completion
  const recordSession = useCallback((turns, correct) => {
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.id !== currentUserId) return u;
        const entry = { ts: Date.now(), topic: teacher.name, turns, correct };
        return { ...u, sessionHistory: [entry, ...(u.sessionHistory||[]).slice(0,49)] };
      });
      localStorage.setItem("aitutor_users", JSON.stringify(updated));
      return updated;
    });
  }, [currentUserId, teacher.name]);

  // Add new user
  const addUser = (name, avatar) => {
    const id = "u_" + Date.now();
    setUsers(prev => {
      const updated = [...prev, { id, name, avatar, createdAt: Date.now(), topicMastery: {}, sessionHistory: [] }];
      localStorage.setItem("aitutor_users", JSON.stringify(updated));
      return updated;
    });
    setCurrentUserId(id);
    localStorage.setItem("aitutor_uid", id);
    setShowNewUser(false);
  };

  // Switch user
  const switchUser = (id) => {
    setCurrentUserId(id);
    localStorage.setItem("aitutor_uid", id);
    setShowUserSwitcher(false);
  };

  // Delete user
  const deleteUser = (id) => {
    if (users.length <= 1) return;
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== id);
      localStorage.setItem("aitutor_users", JSON.stringify(updated));
      return updated;
    });
    if (id === currentUserId) {
      setCurrentUserId(updated[0]?.id);
      localStorage.setItem("aitutor_uid", updated[0]?.id);
    }
  };

  // Persist API keys per user
  const [apiKeys, setApiKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aitutor_apikeys_" + currentUserId) || "{}"); }
    catch { return {}; }
  });
  const [customBaseUrl, setCustomBaseUrl] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aitutor_baseurl_" + currentUserId) || "{}"); }
    catch { return {}; }
  });

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const systemRef = useRef("");
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Check voice support
  useEffect(() => {
    const hasSpeech = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    const hasSynth = "speechSynthesis" in window;
    // Android WebView has no Web Speech API but supports native speech via AndroidPermission bridge
    const hasNativeSpeech = "AndroidTutor" in window;
    setVoiceSupported((hasSpeech && hasSynth) || hasNativeSpeech);
    if (hasSynth) synthRef.current = window.speechSynthesis;
  }, []);

  // Persist model config to localStorage
  useEffect(() => { localStorage.setItem("aitutor_provider", selectedProvider); }, [selectedProvider]);
  useEffect(() => { localStorage.setItem("aitutor_model", selectedModel); }, [selectedModel]);
  useEffect(() => { localStorage.setItem("aitutor_apikeys_" + currentUserId, JSON.stringify(apiKeys)); }, [apiKeys, currentUserId]);
  useEffect(() => { localStorage.setItem("aitutor_baseurl_" + currentUserId, JSON.stringify(customBaseUrl)); }, [customBaseUrl, currentUserId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "46px";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // ── Voice input ──────────────────────────────────────────────────────────
  // Set up Android STT callbacks — registered once, reused
  useEffect(() => {
    if (typeof window === "undefined") return;
    window._sttOnResult = (cbId, transcript) => {
      setIsRecording(false);
      if (transcript && transcript.trim()) {
        const text = transcript.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: text }]);
        callTutor(text, apiHistory, true);
      }
    };
    window._sttOnError = (cbId, err) => {
      setIsRecording(false);
      console.log("STT error:", err);
    };
    return () => {
      window._sttOnResult = undefined;
      window._sttOnError = undefined;
    };
  }, [apiHistory]);

  const startRecording = () => {
    if (loading || isRecording) return;
    // Use Android native speech recognition via AndroidTutor bridge
    if (window.AndroidTutor && window.AndroidTutor.sttStart) {
      try {
        window.AndroidTutor.sttStart("stt_cb_1");
        setIsRecording(true);
      } catch (e) {
        console.error("STT start error:", e);
        setIsRecording(false);
      }
      return;
    }
    // Fallback to Web Speech API (browser only)
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = teacher.lang || "zh-CN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const results = Array.from(e.results);
      const finalResult = results.find(r => r.isFinal);
      if (finalResult) {
        const text = finalResult[0].transcript.trim();
        if (text) {
          setIsRecording(false);
          setTimeout(() => {
            setInput("");
            setMessages(prev => [...prev, { role: "user", content: text }]);
            callTutor(text, apiHistory, true);
          }, 100);
        }
      }
    };
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    if (window.AndroidTutor && window.AndroidTutor.sttStop) {
      try { window.AndroidTutor.sttStop(); } catch (e) {}
    }
    setIsRecording(false);
  };

  // ── Voice output (TTS) ───────────────────────────────────────────────────
  // Set up Android TTS callbacks — manages isSpeaking state
  useEffect(() => {
    if (typeof window === "undefined") return;
    window._ttsReady = () => console.log("TTS ready");
    window._ttsOnStart = () => setIsSpeaking(true);
    window._ttsOnEnd = () => setIsSpeaking(false);
    window._ttsOnError = (err) => {
      console.error("TTS error:", err);
      setIsSpeaking(false);
    };
    return () => {
      window._ttsReady = undefined;
      window._ttsOnStart = undefined;
      window._ttsOnEnd = undefined;
      window._ttsOnError = undefined;
    };
  }, []);

  const speakText = (text) => {
    if (!text || !text.trim()) return;
    // Use Android native TTS via AndroidTutor bridge
    if (window.AndroidTutor && window.AndroidTutor.ttsSpeak) {
      try {
        window.AndroidTutor.ttsSpeak(text);
      } catch (e) {
        console.error("Native TTS error:", e);
      }
      return;
    }
    // Fallback to Web Speech Synthesis
    if (!synthRef.current || !voiceEnabled) return;
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = teacher.lang || "zh-CN";
    utter.rate = 0.95;
    utter.pitch = 1.0;
    const voices = synthRef.current.getVoices();
    const match = voices.find(v => v.lang.startsWith(teacher.lang?.slice(0,2) || "zh"));
    if (match) utter.voice = match;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utter);
  };

  const stopSpeaking = () => {
    if (window.AndroidTutor && window.AndroidTutor.ttsStop) {
      try { window.AndroidTutor.ttsStop(); } catch (e) {}
    }
    setIsSpeaking(false);
    synthRef.current?.cancel();
  };

  // ── Parse AI response ────────────────────────────────────────────────────
  const parseResponse = (text) => {
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace === -1) throw new Error();
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch {
      return { message: text, masteryDelta: 0, currentMastery: mastery, mode: "explain", suggestedResponses: [], insight: "" };
    }
  };

  // ── Smart model routing based on input type ──────────────────────────────
  const getEffectiveModel = useCallback((inputText, isVoiceInput) => {
    const provider = MODEL_PROVIDERS[selectedProvider];

    // 语音输入时自动切换到对应语音模型（如果当前不是语音模型）
    if (isVoiceInput && provider.models.some(m => m.type === "audio")) {
      const currentModel = provider.models.find(m => m.id === selectedModel);
      if (currentModel?.type !== "audio") {
        // 自动切换到语音模型
        const audioModel = provider.models.find(m => m.type === "audio");
        return audioModel?.id || selectedModel;
      }
    }

    // 文本输入时确保使用文本模型
    if (!isVoiceInput && provider.models.some(m => m.type === "text")) {
      const currentModel = provider.models.find(m => m.id === selectedModel);
      if (currentModel?.type && currentModel.type !== "text") {
        // 自动切换到文本模型（使用默认文本模型）
        const defaultTextModel = provider.models.find(m => m.type === "text");
        return defaultTextModel?.id || selectedModel;
      }
    }

    return selectedModel;
  }, [selectedProvider, selectedModel]);

  // ── Call tutor API ───────────────────────────────────────────────────────
  const callTutor = useCallback(async (userMsg, history, isVoiceInput = false) => {
    setLoading(true);
    try {
      const effectiveModel = getEffectiveModel(userMsg, isVoiceInput);
      const msgs = [...history, { role: "user", content: userMsg }];
      const provider = MODEL_PROVIDERS[selectedProvider];
      const apiKey = apiKeys[selectedProvider];
      const baseUrl = customBaseUrl[selectedProvider] || provider.baseUrl;

      if (!apiKey) {
        setMessages(prev => [...prev, { role: "assistant", content: "请先在设置中配置 API Key", mode: "explain", insight: "", suggestedResponses: ["去设置"] }]);
        setLoading(false);
        return;
      }

      // 检测是否为非文本模型
      const modelInfo = provider.models.find(m => m.id === effectiveModel);
      if (modelInfo?.type && modelInfo.type !== "text") {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `当前选择的 ${modelInfo.name} 是${modelInfo.type === "audio" ? "语音" : modelInfo.type === "video" ? "视频" : "音乐"}模型，不适合文本对话。请在设置中切换到文本模型（如 ${provider.models.find(m => m.type === "text")?.name || "文本模型"}）。`,
          mode: "explain",
          insight: "",
          suggestedResponses: ["切换模型"]
        }]);
        setLoading(false);
        return;
      }

      // 构建 OpenAI 兼容格式请求
      const requestBody = {
        model: effectiveModel,
        messages: [
          { role: "system", content: systemRef.current },
          ...msgs,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      };

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API错误: ${res.status}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "{}";
      const parsed = parseResponse(raw);
      const delta = parsed.currentMastery !== undefined
        ? (parsed.currentMastery - mastery)
        : (parsed.masteryDelta ?? 0);
      const newMastery = Math.max(0, Math.min(100, mastery + delta));

      const newHistory = [...msgs, { role: "assistant", content: raw }];
      setApiHistory(newHistory);

      const aiMsg = {
        role: "assistant",
        content: parsed.message || "（解析失败，请重试）",
        mode: parsed.mode || "explain",
        insight: parsed.insight || "",
        suggestedResponses: parsed.suggestedResponses || [],
      };
      setMessages(prev => [...prev, aiMsg]);
      if (delta !== 0) updateMastery(delta);
      setSessionStats(prev => ({ ...prev, turns: prev.turns + 1 }));

      if (autoSpeak && parsed.message) speakText(parsed.message.slice(0, 200));
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `网络或API错误：${e.message}，请稍后重试～`, mode: "explain", insight: "", suggestedResponses: ["重试", "好的"] }]);
    } finally {
      setLoading(false);
    }
  }, [mastery, autoSpeak, teacher.lang, selectedProvider, selectedModel, apiKeys, customBaseUrl, getEffectiveModel]);

  const handleStart = async () => {
    if (!subject.trim()) return;
    const t = getTeacher(subject);
    setTeacher(t);
    systemRef.current = buildSystem(subject.trim(), level, goal.trim(), t);
    setPhase("chat");
    setMessages([]);
    setApiHistory([]);
    setSessionStats({ turns: 0, startTime: Date.now() });

    // 外语学习时默认启用语音交互
    const isForeignLang = t.lang === "en-US";
    if (isForeignLang) {
      setVoiceEnabled(true);
      setAutoSpeak(true);
    }

    await callTutor(`你好，我想学「${subject.trim()}」，请开始吧。`, []);
  };

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    if (isRecording) stopRecording();
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    const wasVoice = lastInputWasVoice;
    setLastInputWasVoice(false); // 重置语音输入标记
    await callTutor(msg, apiHistory, wasVoice);
  };

  // ── Mode label/color ──────────────────────────────────────────────────────
  const MODE_INFO = {
    explore:   { label: "🔍 探索提问", color: "#60a5fa" },
    explain:   { label: "📖 知识讲解", color: T.accent },
    test:      { label: "✏️ 知识测验", color: "#a78bfa" },
    praise:    { label: "🌟 答得好",   color: "#4ade80" },
    redirect:  { label: "🔄 再想一想", color: "#f87171" },
    milestone: { label: "🏆 里程碑",   color: "#fbbf24" },
  };

  const LEVELS = ["零基础", "初学者", "有些了解", "中级", "高级"];
  const PRESETS = ["Python编程", "英语口语", "高中数学", "经济学", "机器学习", "历史"];

  // ═══════════════════════════════════════════════════════════════════════════
  // ONBOARDING SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === "onboard") return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Georgia','Times New Roman',serif", overflowY: "auto", position: "relative" }}>
      <style>{`
        @keyframes dotBounce { 0%,80%,100%{transform:scale(0.5);opacity:0.3} 40%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
        input, button { outline: none; }
      `}</style>
      {/* Ambient */}
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${T.orb1} 0%, transparent 70%)`, left: -150, top: -150, pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${T.orb2} 0%, transparent 70%)`, right: -100, bottom: 0, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderBottom: `1px solid ${T.border}`, background: T.headerBg, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.accent, display: "flex", alignItems: "center", gap: 8 }}>
          <span>🕯</span> 私塾 · AI家教
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Model config */}
          <button onClick={() => setShowModelConfig(true)}
            title="模型配置"
            style={{ background: T.accentGlow, border: `1px solid ${T.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 14, cursor: "pointer", color: T.accent }}>
            🤖
          </button>
          {/* User switcher */}
          <button onClick={() => setShowUserSwitcher(true)}
            title={`${currentUser.name} · 切换用户`}
            style={{ background: T.accentGlow, border: `1px solid ${T.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 14, cursor: "pointer", color: T.accent }}>
            {currentUser.avatar}
          </button>
          {Object.values(THEMES).map(th => (
            <button key={th.id} onClick={() => setThemeId(th.id)}
              title={th.name}
              style={{ background: themeId === th.id ? T.accentGlow : "transparent", border: `1px solid ${themeId === th.id ? T.accent : T.border}`, borderRadius: 20, padding: "4px 10px", fontSize: 14, cursor: "pointer", transition: "all 0.2s", color: themeId === th.id ? T.accent : T.textMuted }}>
              {th.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px", display: "flex", flexDirection: "column", gap: 32, animation: "fadeUp 0.5s ease" }}>
        {/* Hero */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
            <span style={{ background: `linear-gradient(135deg, ${T.text}, ${T.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>你的专属 AI 家教<br />已就位</span>
          </div>
          <div style={{ fontSize: 15, color: T.textDim, lineHeight: 1.75 }}>
            不是搜索引擎，不是空白输入框<br />
            而是一位懂你的导师，从漏洞到掌握，超越98%的同龄人
          </div>
        </div>

        {/* Input Card */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", gap: 20, boxShadow: `0 8px 32px rgba(0,0,0,0.2)` }}>
          {/* Subject */}
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", marginBottom: 8 }}>我想学什么</div>
            <input
              value={subject} onChange={e => setSubject(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleStart()}
              placeholder="Python编程 / 英语口语 / 高中数学 / 自定义…"
              style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", color: T.text, fontSize: 14.5, fontFamily: "inherit", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = T.accent}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {PRESETS.map(s => (
                <button key={s} onClick={() => setSubject(s)}
                  style={{ background: subject === s ? T.accentGlow : "transparent", border: `1px solid ${subject === s ? T.accent : T.border}`, borderRadius: 14, padding: "4px 10px", color: subject === s ? T.accent : T.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", marginBottom: 8 }}>当前水平</div>
            <div style={{ display: "flex", gap: 6 }}>
              {LEVELS.map(l => (
                <button key={l} onClick={() => setLevel(l)}
                  style={{ flex: 1, background: level === l ? T.accentGlow : T.surface, border: `1px solid ${level === l ? T.accent : T.border}`, borderRadius: 8, padding: "7px 0", color: level === l ? T.accent : T.textDim, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: level === l ? 600 : 400, transition: "all 0.2s" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace", marginBottom: 8 }}>学习目标（选填）</div>
            <input
              value={goal} onChange={e => setGoal(e.target.value)}
              placeholder="例如：通过期末考试 / 能独立写代码 / 日常对话…"
              style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", color: T.text, fontSize: 14, fontFamily: "inherit", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = T.accent}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          {/* Teacher preview */}
          {subject && (() => {
            const t = getTeacher(subject);
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: T.accentGlow, border: `1px solid ${T.accent}33`, borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: T.accentGlow, border: `1px solid ${T.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: T.accent, fontWeight: 700, flexShrink: 0 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{t.name} <span style={{ fontSize: 12, color: T.textDim }}>· {t.title}</span></div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>将担任你的专属导师 {t.lang === "en-US" ? "🎙️ 支持英语语音" : "🎙️ 支持中文语音"}</div>
                </div>
              </div>
            );
          })()}

          {/* Start button */}
          <button onClick={handleStart} disabled={!subject.trim()}
            style={{ background: subject.trim() ? `linear-gradient(135deg, ${T.accent}, ${T.accentDim})` : T.border, border: "none", borderRadius: 12, padding: "14px", color: subject.trim() ? T.userText : T.textMuted, fontSize: 15, fontWeight: 700, cursor: subject.trim() ? "pointer" : "not-allowed", fontFamily: "inherit", letterSpacing: "0.04em", transition: "opacity 0.2s" }}>
            开始一对一学习 →
          </button>
        </div>

        {/* Features */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { i: "🔍", t: "知识漏洞诊断", d: "先摸底再讲，精准找到你的盲区" },
            { i: "📊", t: "掌握率追踪", d: "实时监测，低于80%绝不推进" },
            { i: "🎙️", t: "实时语音对话", d: "说出你的答案，打造沉浸式环境" },
            { i: "🧑‍🏫", t: "专属教师人格", d: "不同学科匹配不同风格导师" },
          ].map(f => (
            <div key={f.t} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{f.i}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, marginBottom: 3 }}>{f.t}</div>
                <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5 }}>{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Config Modal */}
      {showModelConfig && (
        <ModelConfigPanel
          T={T}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          apiKeys={apiKeys}
          setApiKeys={setApiKeys}
          customBaseUrl={customBaseUrl}
          setCustomBaseUrl={setCustomBaseUrl}
          showModelDropdown={showModelDropdown}
          setShowModelDropdown={setShowModelDropdown}
          onClose={() => setShowModelConfig(false)}
        />
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  const [ml, mlIcon] = masteryLabel(mastery);
  const elapsed = sessionStats.startTime ? Math.round((Date.now() - sessionStats.startTime) / 60000) : 0;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: T.bg, color: T.text, fontFamily: "'Georgia','Times New Roman',serif", overflow: "hidden", position: "relative" }}>
      <style>{`
        @keyframes dotBounce { 0%,80%,100%{transform:scale(0.5);opacity:0.3} 40%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes recordPulse { 0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,0.4)} 50%{box-shadow:0 0 0 8px rgba(248,113,113,0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
        textarea:focus { border-color: ${T.accent} !important; outline: none; }
        .qbtn:hover { background: ${T.accentGlow} !important; border-color: ${T.accent} !important; }
        .iconbtn:hover { opacity: 0.8; }
      `}</style>

      {/* Ambient */}
      <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${T.orb1} 0%, transparent 70%)`, left: -150, top: -100, pointerEvents: "none", zIndex: 0 }} />

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${T.border}`, background: T.headerBg, backdropFilter: "blur(12px)", flexShrink: 0, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="iconbtn" onClick={() => setPhase("onboard")} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20, padding: "2px 4px", lineHeight: 1 }}>←</button>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.accentGlow, border: `1px solid ${T.accent}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: T.accent, fontWeight: 700 }}>
            {teacher.avatar}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.2 }}>{teacher.name} <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 400 }}>· {teacher.title}</span></div>
            <div style={{ fontSize: 11, color: T.textMuted, display: "flex", gap: 8 }}>
              <span style={{ color: T.accent }}>{subject}</span>
              <span>·</span>
              <span>{level}</span>
              <span>·</span>
              <span>第{sessionStats.turns}轮</span>
              {elapsed > 0 && <><span>·</span><span>{elapsed}分钟</span></>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Theme switcher */}
          <div style={{ position: "relative" }}>
            <button className="iconbtn" onClick={() => setShowThemes(p => !p)}
              style={{ background: T.accentGlow, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 10px", color: T.accent, cursor: "pointer", fontSize: 14 }}>
              {THEMES[themeId].icon}
            </button>
            {showThemes && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 8, display: "flex", flexDirection: "column", gap: 4, zIndex: 200, minWidth: 130 }}>
                {Object.values(THEMES).map(th => (
                  <button key={th.id} onClick={() => { setThemeId(th.id); setShowThemes(false); }}
                    style={{ background: themeId === th.id ? T.accentGlow : "transparent", border: "none", borderRadius: 8, padding: "6px 10px", color: themeId === th.id ? T.accent : T.textDim, cursor: "pointer", fontSize: 13, textAlign: "left", display: "flex", gap: 8, alignItems: "center", fontFamily: "inherit" }}>
                    {th.icon} {th.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Model config */}
          <button className="iconbtn" onClick={() => setShowModelConfig(true)}
            title="模型配置"
            style={{ background: T.accentGlow, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 8px", color: T.accent, cursor: "pointer", fontSize: 14 }}>
            🤖
          </button>
          {/* Voice toggle */}
          {voiceSupported && (
            <button className="iconbtn" onClick={() => { setAutoSpeak(p => !p); setVoiceEnabled(p => !p); }}
              title={autoSpeak ? "关闭自动朗读" : "开启自动朗读"}
              style={{ background: autoSpeak ? T.accentGlow : "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 8px", color: autoSpeak ? T.accent : T.textMuted, cursor: "pointer", fontSize: 14 }}>
              {autoSpeak ? "🔊" : "🔇"}
            </button>
          )}
          {/* Mastery ring */}
          <MasteryRing value={mastery} accent={T.accent} />
        </div>
      </div>

      {/* ── Mastery bar ── */}
      <div style={{ height: 3, background: T.border, flexShrink: 0, position: "relative", zIndex: 9 }}>
        <div style={{ height: "100%", width: `${mastery}%`, background: `linear-gradient(90deg, ${masteryColor(mastery)}, ${masteryColor(Math.min(mastery+20,100))})`, transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: `0 0 6px ${masteryColor(mastery)}` }} />
      </div>

      {/* ── Chat messages ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 780, width: "100%", margin: "0 auto", alignSelf: "stretch", position: "relative", zIndex: 1 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: 10, alignItems: "flex-start", animation: "fadeUp 0.25s ease" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: msg.role === "user" ? `linear-gradient(135deg, ${T.accent}, ${T.accentDim})` : T.accentGlow, border: msg.role === "user" ? "none" : `1px solid ${T.border}`, color: msg.role === "user" ? T.userText : T.accent }}>
              {msg.role === "user" ? "你" : teacher.avatar}
            </div>
            <div style={{ maxWidth: "76%" }}>
              {msg.role === "assistant" && msg.mode && MODE_INFO[msg.mode] && (
                <div style={{ fontSize: 11, fontFamily: "monospace", padding: "2px 8px", borderRadius: 10, background: `${MODE_INFO[msg.mode].color}18`, color: MODE_INFO[msg.mode].color, display: "inline-block", marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em" }}>
                  {MODE_INFO[msg.mode].label}
                </div>
              )}
              <div style={{ background: msg.role === "user" ? T.userBubble : T.card, border: msg.role === "user" ? "none" : `1px solid ${T.border}`, borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px", padding: "11px 15px", color: msg.role === "user" ? T.userText : T.text, fontSize: 14.5, lineHeight: 1.65, boxShadow: `0 2px 8px rgba(0,0,0,0.15)` }}>
                {msg.content.split("\n").map((line, j, arr) => (
                  <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                ))}
              </div>
              {msg.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                  {msg.insight && <div style={{ fontSize: 11, color: T.textMuted, fontStyle: "italic", fontFamily: "monospace" }}>💭 {msg.insight}</div>}
                  {voiceSupported && (
                    <button className="iconbtn" onClick={() => speakText(msg.content)}
                      style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 13, padding: "0 4px" }} title="朗读">
                      🔊
                    </button>
                  )}
                </div>
              )}
              {msg.role === "assistant" && msg.suggestedResponses?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {msg.suggestedResponses.map((r, j) => (
                    <button key={j} className="qbtn" onClick={() => handleSend(r)}
                      style={{ background: T.surface, border: `1px solid ${T.accent}33`, borderRadius: 18, padding: "5px 12px", color: T.accent, fontSize: 13, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}>
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <TypingDots T={T} teacher={teacher} />}
        <div ref={chatEndRef} />
      </div>

      {/* ── Mastery milestone banner ── */}
      {mastery >= 80 && messages.length > 0 && !loading && (
        <div style={{ margin: "0 16px 4px", maxWidth: 780, alignSelf: "center", width: "calc(100% - 32px)", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.35)", borderRadius: 10, padding: "8px 14px", fontSize: 13, color: "#4ade80", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          ✨ 掌握率已达 <strong>{mastery}%</strong>！这个知识点你已经真正掌握了，可以继续深入。
        </div>
      )}

      {/* ── Input area ── */}
      <div style={{ padding: "10px 16px 16px", borderTop: `1px solid ${T.border}`, maxWidth: 780, width: "100%", margin: "0 auto", flexShrink: 0, position: "relative", zIndex: 10 }}>
        {/* Speak if TTS is active */}
        {isSpeaking && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12, color: T.accent }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, animation: "pulse 1s infinite" }} />
            {teacher.name}正在朗读… <button onClick={stopSpeaking} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>停止</button>
          </div>
        )}

        {/* 语音/文字模式切换提示 */}
        {voiceSupported && !isRecording && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 12, color: T.textMuted }}>
            <button
              onClick={() => { setVoiceEnabled(p => !p); setAutoSpeak(p => !p); }}
              style={{
                background: voiceEnabled ? T.accentGlow : "transparent",
                border: `1px solid ${voiceEnabled ? T.accent : T.border}`,
                borderRadius: 12, padding: "3px 10px", cursor: "pointer",
                color: voiceEnabled ? T.accent : T.textMuted, fontSize: 11, fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {voiceEnabled ? "🎙 语音模式" : "⌨️ 文字模式"}
            </button>
            <span style={{ fontSize: 10 }}>{voiceEnabled ? "点击切换为文字输入" : "点击切换为语音输入"}</span>
          </div>
        )}

        {/* ── Voice mode: large hold-to-speak button ── */}
        {voiceSupported && voiceEnabled ? (
          <button
            type="button"
            disabled={loading}
            onTouchStart={e => {
              e.stopPropagation();
              e.preventDefault();
              if (!loading) startRecording();
            }}
            onTouchEnd={e => {
              e.stopPropagation();
              e.preventDefault();
              if (isRecording) stopRecording();
            }}
            onTouchCancel={e => {
              e.stopPropagation();
              e.preventDefault();
              if (isRecording) stopRecording();
            }}
            onMouseDown={e => {
              e.preventDefault();
              if (!loading) startRecording();
            }}
            onMouseUp={e => {
              e.preventDefault();
              if (isRecording) stopRecording();
            }}
            onMouseLeave={e => {
              if (isRecording) { e.preventDefault(); stopRecording(); }
            }}
            style={{
              width: "100%", height: 64, borderRadius: 32,
              background: isRecording
                ? "linear-gradient(135deg, #f87171, #ef4444)"
                : `linear-gradient(135deg, ${T.accent}22, ${T.accentDim}22)`,
              border: `2px solid ${isRecording ? "#f87171" : T.accent + "88"}`,
              color: isRecording ? "#fff" : T.accent,
              fontSize: 18, fontWeight: 700, fontFamily: "inherit",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: 3,
              transition: "all 0.15s",
              boxShadow: isRecording ? "0 0 30px rgba(248,113,113,0.4)" : `0 0 24px ${T.accentGlow}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: isRecording ? "scale(0.97)" : "scale(1)",
              opacity: loading ? 0.5 : 1,
              touchAction: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {isRecording ? "⏹ 松开发送" : "🎙 按住说话"}
          </button>
        ) : (
        /* ── Text mode: textarea + send button ── */
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={loading}
            placeholder="输入你的回答或问题… (Enter发送，Shift+Enter换行)"
            rows={1}
            style={{ flex: 1, background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px", color: T.text, fontSize: 14, lineHeight: 1.5, resize: "none", fontFamily: "inherit", transition: "border-color 0.2s", minHeight: 46, maxHeight: 120, boxShadow: "none" }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{
              width: 44, height: 44, borderRadius: 12, border: "none",
              background: (loading || !input.trim()) ? T.border : `linear-gradient(135deg, ${T.accent}, ${T.accentDim})`,
              color: (loading || !input.trim()) ? T.textMuted : T.userText,
              cursor: (loading || !input.trim()) ? "not-allowed" : "pointer",
              fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
            {loading ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: 16 }}>⟳</span> : "↑"}
          </button>
        </div>
        )}
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6, textAlign: "center" }}>
          {mastery < 80
            ? `💡 勇敢说出你的想法——答错了也没关系，错误是最好的老师 · 掌握率 ${mastery}%`
            : `🏆 你已掌握这个知识点！告诉${teacher.name}你想学什么新内容吧`}
        </div>
      </div>

      {/* Model Config Modal */}
      {showModelConfig && (
        <ModelConfigPanel
          T={T}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          apiKeys={apiKeys}
          setApiKeys={setApiKeys}
          customBaseUrl={customBaseUrl}
          setCustomBaseUrl={setCustomBaseUrl}
          showModelDropdown={showModelDropdown}
          setShowModelDropdown={setShowModelDropdown}
          onClose={() => setShowModelConfig(false)}
        />
      )}

      {/* User Switcher Modal */}
      {showUserSwitcher && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24, width: "100%", maxWidth: 360, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>切换用户</span>
              <button onClick={() => setShowUserSwitcher(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 20 }}>✕</button>
            </div>
            {/* User list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {users.map(u => (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12,
                  background: u.id === currentUserId ? T.accentGlow : T.inputBg,
                  border: `1px solid ${u.id === currentUserId ? T.accent : T.border}`,
                  cursor: "pointer",
                }} onClick={() => switchUser(u.id)}>
                  <span style={{ fontSize: 28 }}>{u.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>掌握 {Object.keys(u.topicMastery||{}).length} 个话题</div>
                  </div>
                  {u.id === currentUserId && <span style={{ color: T.accent, fontSize: 14 }}>✓</span>}
                  {users.length > 1 && <button onClick={e => { e.stopPropagation(); deleteUser(u.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 14 }}>🗑</button>}
                </div>
              ))}
            </div>
            {/* Add new user */}
            {showNewUser ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  id="new_user_name"
                  placeholder="用户名（昵称）"
                  style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", color: T.text, fontSize: 14, fontFamily: "inherit", width: "100%" }}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["👤","🧑","👨","👩","🧒","👴","👵","🤖"].map(a => (
                    <button key={a} className="new_user_avatar_btn" onClick={() => { const i = document.getElementById("new_user_name"); if(i) i.value = a; }}
                      style={{ background: T.inputBg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 18, cursor: "pointer" }}>{a}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => {
                    const i = document.getElementById("new_user_name");
                    const name = i?.value?.trim() || "我";
                    const avatarEl = document.querySelector(".new_user_avatar_btn");
                    const avatar = "👤";
                    addUser(name, avatar);
                  }}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: `linear-gradient(135deg, ${T.accent}, ${T.accentDim})`, border: "none", color: T.userText, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    创建
                  </button>
                  <button onClick={() => setShowNewUser(false)}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, background: T.inputBg, border: `1px solid ${T.border}`, color: T.text, cursor: "pointer", fontFamily: "inherit" }}>
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowNewUser(true)}
                style={{ width: "100%", padding: "10px", borderRadius: 10, background: T.inputBg, border: `1px dashed ${T.border}`, color: T.textMuted, cursor: "pointer", fontFamily: "inherit" }}>
                + 添加新用户
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
