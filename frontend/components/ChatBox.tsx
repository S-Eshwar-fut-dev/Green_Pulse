"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { postQuery } from "@/lib/api";
import type { QueryResult } from "@/lib/types";

interface Message {
    id: string;
    role: "user" | "ai";
    text: string;
    result?: QueryResult;
}

const DEMO_QUESTIONS = [
    "Which truck has emitted the most CO₂ in the last hour?",
    "How much carbon has our fleet saved vs baseline today?",
    "Are there any active anomalies right now?",
    "What is the most fuel-efficient route in our fleet today?",
    "Does our current emission rate comply with the National Logistics Policy targets?",
];

export default function ChatBox() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function send(question: string) {
        if (!question.trim() || loading) return;
        const userMsg: Message = { id: Date.now().toString(), role: "user", text: question };
        setMessages((p) => [...p, userMsg]);
        setInput("");
        setLoading(true);
        try {
            const result = await postQuery(question);
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "ai", text: result.answer, result };
            setMessages((p) => [...p, aiMsg]);
        } catch {
            setMessages((p) => [...p, { id: Date.now().toString() + "e", role: "ai", text: "**Error:** Could not reach GreenAI. Check API server." }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 12, display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #30363d" }}>
                <span style={{ color: "#00ff87", fontWeight: 700, fontSize: "0.85rem" }}>💬 ASK GREENAI</span>
            </div>

            <div style={{ padding: "8px 12px", borderBottom: "1px solid #30363d", display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DEMO_QUESTIONS.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => send(q)}
                        style={{ background: "#21262d", border: "1px solid #30363d", borderRadius: 20, padding: "3px 10px", color: "#8b949e", fontSize: "0.7rem", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                        {q.slice(0, 40)}…
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map((m) => (
                    <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                        {m.role === "user" ? (
                            <div style={{ background: "#00ff8722", border: "1px solid #00ff8744", borderRadius: "12px 12px 4px 12px", padding: "8px 14px", maxWidth: "70%", color: "#e6edf3", fontSize: "0.875rem" }}>
                                {m.text}
                            </div>
                        ) : (
                            <div style={{ background: "#21262d", border: "1px solid #30363d", borderRadius: "12px 12px 12px 4px", padding: "12px 16px", maxWidth: "85%", fontSize: "0.875rem" }}>
                                <div style={{ color: "#e6edf3" }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                                </div>
                                {m.result && (
                                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                        {m.result.live_data_used && (
                                            <span style={{ background: "#00ff8722", border: "1px solid #00ff8755", color: "#00ff87", padding: "2px 8px", borderRadius: 20, fontSize: "0.68rem" }}>📡 Live Data</span>
                                        )}
                                        {m.result.sources.map((s, i) => (
                                            <span key={i} style={{ background: "#30363d", color: "#8b949e", padding: "2px 8px", borderRadius: 20, fontSize: "0.68rem" }}>{s}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                        <div style={{ background: "#21262d", border: "1px solid #30363d", borderRadius: 12, padding: "10px 16px", color: "#8b949e", fontSize: "0.875rem" }}>
                            GreenAI is thinking…
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div style={{ padding: 12, borderTop: "1px solid #30363d", display: "flex", gap: 8 }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
                    placeholder="Ask about your fleet CO₂, routes, or compliance…"
                    style={{ flex: 1, background: "#21262d", border: "1px solid #30363d", borderRadius: 8, padding: "8px 14px", color: "#e6edf3", fontSize: "0.875rem", outline: "none" }}
                />
                <button
                    onClick={() => send(input)}
                    disabled={loading}
                    style={{ background: "#00ff87", color: "#0d1117", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem", opacity: loading ? 0.5 : 1 }}
                >
                    Ask
                </button>
            </div>
        </div>
    );
}
