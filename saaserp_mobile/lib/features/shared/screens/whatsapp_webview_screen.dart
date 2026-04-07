import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:google_fonts/google_fonts.dart';

class WhatsAppWebviewScreen extends StatefulWidget {
  const WhatsAppWebviewScreen({Key? key}) : super(key: key);

  @override
  State<WhatsAppWebviewScreen> createState() => _WhatsAppWebviewScreenState();
}

class _WhatsAppWebviewScreenState extends State<WhatsAppWebviewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _isLandscape = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF111B21))
      ..setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      )
      ..enableZoom(true)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            // Force desktop-width viewport so WhatsApp Web renders its full UI
            _controller.runJavaScript('''
              (function() {
                // Remove any existing viewport meta
                var existing = document.querySelector('meta[name="viewport"]');
                if (existing) existing.remove();

                // Create a new one forcing desktop width
                var meta = document.createElement('meta');
                meta.name = 'viewport';
                meta.content = 'width=1280, initial-scale=0.35, minimum-scale=0.2, maximum-scale=3.0, user-scalable=yes';
                document.head.appendChild(meta);

                // Also fix body to prevent overflow hiding
                document.body.style.overflowX = 'hidden';
                document.body.style.minWidth = '1280px';
              })();
            ''');
            if (mounted) setState(() => _isLoading = false);
          },
        ),
      )
      ..loadRequest(Uri.parse('https://web.whatsapp.com/'));
  }

  @override
  Widget build(BuildContext context) {
    _isLandscape = MediaQuery.of(context).orientation == Orientation.landscape;

    return Scaffold(
      appBar: _isLandscape
          ? null
          : AppBar(
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.chat, size: 16, color: Color(0xFF25D366)),
                  ),
                  const SizedBox(width: 8),
                  Text('WhatsApp Web',
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
              backgroundColor: const Color(0xFF25D366),
              foregroundColor: Colors.white,
              toolbarHeight: 48,
              actions: [
                IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: () {
                    setState(() => _isLoading = true);
                    _controller.reload();
                  },
                ),
              ],
            ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            Container(
              color: const Color(0xFF111B21),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(color: Color(0xFF25D366)),
                    const SizedBox(height: 16),
                    Text('Cargando WhatsApp Web...',
                        style: GoogleFonts.inter(
                          color: Colors.white70,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        )),
                    const SizedBox(height: 8),
                    Text('Usa gestos de pellizco para hacer zoom',
                        style: GoogleFonts.inter(
                          color: Colors.white38,
                          fontSize: 12,
                        )),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
