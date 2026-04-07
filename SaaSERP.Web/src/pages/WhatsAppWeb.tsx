import React from 'react';

const WhatsAppWeb: React.FC = () => {
    return (
        <div className="h-full w-full flex flex-col bg-slate-50 relative overflow-hidden rounded-[2rem]">
            {/* Header decorativo opcional */}
            <div className="shrink-0 p-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                    <svg xmlns="http://www.w3.org/.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-message-circle"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                </div>
                <div>
                    <h2 className="font-bold text-lg leading-tight">WhatsApp Web</h2>
                    <p className="text-white/80 text-xs font-medium">Chat interno para trabajadores</p>
                </div>
            </div>

            {/* Iframe */}
            <div className="flex-1 bg-white relative">
                <iframe
                    src="https://web.whatsapp.com/"
                    className="absolute inset-0 w-full h-full border-0"
                    title="WhatsApp Web"
                    allow="camera; microphone; display-capture; autoplay; clipboard-write"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-presentation"
                />
            </div>
        </div>
    );
};

export default WhatsAppWeb;
