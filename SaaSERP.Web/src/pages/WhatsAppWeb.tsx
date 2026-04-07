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

            {/* Mensaje Informativo y Botón */}
            <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-message-circle text-green-500"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">WhatsApp Web requiere una ventana flotante</h3>
                <p className="text-slate-500 max-w-md mb-8">
                    Por políticas de seguridad de Meta, WhatsApp Web no puede ser incrustado directamente dentro de la plataforma. Da clic en el botón de abajo para abrirlo en una ventana segura aislada.
                </p>
                <button
                    onClick={() => {
                        window.open(
                            'https://web.whatsapp.com/',
                            'WhatsAppWebWindow',
                            'width=1000,height=700,status=no,menubar=no,toolbar=no,scrollbars=yes,resizable=yes'
                        );
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-green-500/30 transform transition-all active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                    Abrir WhatsApp Web
                </button>
            </div>
        </div>
    );
};

export default WhatsAppWeb;
