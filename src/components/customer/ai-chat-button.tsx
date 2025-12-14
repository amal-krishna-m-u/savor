"use client";

import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { MessageCircle, Sparkles } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { chatWithAI } from "@/app/api/chat/actions";

interface AIChatButtonProps {
    menuContext?: any[];
}

export function AIChatButton({ menuContext = [] }: AIChatButtonProps) {
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: "Hi! I'm SAVOR, your AI Waiter. Ask me for recommendations based on your taste!" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    // Auto-scroll ref
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput("");
        setLoading(true);

        try {
            // Simplify context to save tokens
            const contextString = menuContext.map(i => `${i.name} ($${i.price}) - ${i.restaurantName}: ${i.description} `).join('\n');

            const { success, reply } = await chatWithAI(userMsg, contextString);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: reply
            }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to the kitchen." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Sheet>
                <SheetTrigger asChild>
                    <Button size="lg" className="rounded-full h-14 w-14 shadow-xl bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white p-0 overflow-hidden bg-white">
                        {/* Use Logo as Trigger Icon */}
                        <div className="relative w-10 h-10">
                            <Image
                                src="/logo.png"
                                alt="Savor AI"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </Button>
                </SheetTrigger>
                {/* Mobile: 100dvh or 85dvh to account for keyboard. Desktop: right sheet */}
                <SheetContent side="bottom" className="h-[90dvh] md:h-full md:w-[400px] md:rounded-none rounded-t-xl overflow-hidden flex flex-col">
                    <SheetHeader className="border-b pb-4">
                        <SheetTitle className="flex items-center gap-2">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border">
                                <Image
                                    src="/logo.png"
                                    alt="Savor AI"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-orange-600">S.A.V.O.R</span>
                        </SheetTitle>
                    </SheetHeader>

                    {/* Main Chat Container - Grows to fill space */}
                    <div className="flex-1 overflow-hidden flex flex-col min-h-0 pt-4 pb-2">
                        <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-4 px-1">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} `}>
                                        <div className={`max - w - [85 %] rounded - 2xl px - 4 py - 3 text - sm shadow - sm ${m.role === 'user'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-white border text-gray-800'
                                            } `}>
                                            {/* Render Markdown */}
                                            {m.role === 'assistant' ? (
                                                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:p-2 prose-pre:rounded">
                                                    <ReactMarkdown
                                                        components={{
                                                            // Override styles for specific elements if needed
                                                            p: ({ children }: any) => <p className="mb-1 last:mb-0">{children}</p>,
                                                            strong: ({ children }: any) => <span className="font-bold text-orange-700">{children}</span>,
                                                            ul: ({ children }: any) => <ul className="list-disc ml-4 space-y-1">{children}</ul>,
                                                            ol: ({ children }: any) => <ol className="list-decimal ml-4 space-y-1">{children}</ol>,
                                                        }}
                                                    >
                                                        {m.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                m.content
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-50 rounded-2xl px-4 py-2 text-xs text-gray-500 animate-pulse flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-orange-400" />
                                            Thinking...
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Input Area - Fixed at bottom of container */}
                    <div className="mt-auto pt-2 pb-safe-area-bottom">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Ask about the menu..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                className="flex-1 border-orange-200 focus-visible:ring-orange-500"
                                autoComplete="off"
                            />
                            <Button onClick={sendMessage} disabled={loading} size="icon" className="shrink-0 w-10 bg-orange-600 hover:bg-orange-700 text-white">
                                <MessageCircle className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
