"use client";

import { Button } from "@/components/ui/button";
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
        { role: 'assistant', content: "Hi! I'm your AI Waiter. Ask me for recommendations based on your taste!" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput("");
        setLoading(true);

        try {
            // Simplify context to save tokens
            const contextString = menuContext.map(i => `${i.name} ($${i.price}) - ${i.restaurantName}: ${i.description}`).join('\n');

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
                    <Button size="lg" className="rounded-full h-14 w-14 shadow-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white p-0">
                        <Sparkles className="w-6 h-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] rounded-t-xl md:h-full md:w-[400px] md:rounded-none">
                    <SheetHeader>
                        <SheetTitle className="flex items-center">
                            <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                            AI Waiter
                        </SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col h-full pb-6 pt-4">
                        <ScrollArea className="flex-1 pr-4 mb-4">
                            <div className="space-y-4">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg p-3 text-sm ${m.role === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {loading && <div className="text-xs text-gray-400">AI is thinking...</div>}
                            </div>
                        </ScrollArea>
                        <div className="flex gap-2 mt-auto">
                            <Input
                                placeholder="Ask about ingredients, spice level..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <Button onClick={sendMessage} disabled={loading}>Send</Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
