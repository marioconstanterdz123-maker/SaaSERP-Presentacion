import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscureText = true;
  String _error = '';

  void _login() async {
    setState(() => _error = '');
    if (_formKey.currentState!.validate()) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final success = await authProvider.login(
        _emailController.text.trim(),
        _passwordController.text,
      );

      if (success && mounted) {
        // Redirection happens natively in the router or via provider listener
      } else if (mounted) {
        setState(() => _error = 'Correo o contraseña incorrectos.');
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617), // bg-slate-950
      body: Stack(
        children: [
          // Background gradient blobs
          _AnimatedBlob(
            size: 500,
            color: const Color(0xFF7C3AED).withOpacity(0.3), // violet-600
            top: -100,
            left: -50,
          ),
          _AnimatedBlob(
            size: 500,
            color: const Color(0xFF4F46E5).withOpacity(0.3), // indigo-600
            bottom: -100,
            right: -50,
            delayed: true,
          ),
          _AnimatedBlob(
            size: 300,
            color: const Color(0xFFC026D3).withOpacity(0.2), // fuchsia-600
            top: MediaQuery.of(context).size.height * 0.3,
            right: -50,
            delayed: true,
          ),

          // Main form
          Positioned.fill(
            child: SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Logo / Brand
                      Center(
                        child: Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF8B5CF6), Color(0xFF4F46E5)], // violet-500 to indigo-600
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF8B5CF6).withOpacity(0.4),
                                blurRadius: 24,
                                offset: const Offset(0, 10),
                              )
                            ],
                          ),
                          child: const Icon(Icons.bolt, color: Colors.white, size: 32),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'SaaSERP Victoria',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Sistema de Gestión Multisucursal',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          color: const Color(0xFF94A3B8), // slate-400
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 40),

                      // Card
                      ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                          child: Container(
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(color: Colors.white.withOpacity(0.1)),
                            ),
                            child: Form(
                              key: _formKey,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Text(
                                    'Iniciar Sesión',
                                    style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Accede con las credenciales asignadas por tu administrador.',
                                    style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                                  ),
                                  const SizedBox(height: 24),

                                  if (_error.isNotEmpty) ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEF4444).withOpacity(0.1), // red-500/10
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.2)),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.error_outline, color: Color(0xFFFCA5A5), size: 18), // red-300
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Text(_error, style: GoogleFonts.inter(color: const Color(0xFFFCA5A5), fontSize: 13, fontWeight: FontWeight.w600)),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 24),
                                  ],

                                  Text(
                                    'CORREO ELECTRÓNICO',
                                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1),
                                  ),
                                  const SizedBox(height: 8),
                                  TextFormField(
                                    controller: _emailController,
                                    keyboardType: TextInputType.emailAddress,
                                    style: GoogleFonts.inter(color: Colors.white),
                                    decoration: InputDecoration(
                                      hintText: 'admin@saaserp.com',
                                      hintStyle: GoogleFonts.inter(color: const Color(0xFF64748B)),
                                      filled: true,
                                      fillColor: Colors.white.withOpacity(0.05),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF8B5CF6), width: 1.5)),
                                    ),
                                    validator: (v) => v!.isEmpty ? 'Requerido' : null,
                                  ),
                                  const SizedBox(height: 20),

                                  Text(
                                    'CONTRASEÑA',
                                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), letterSpacing: 1),
                                  ),
                                  const SizedBox(height: 8),
                                  TextFormField(
                                    controller: _passwordController,
                                    obscureText: _obscureText,
                                    style: GoogleFonts.inter(color: Colors.white),
                                    decoration: InputDecoration(
                                      hintText: '••••••••',
                                      hintStyle: GoogleFonts.inter(color: const Color(0xFF64748B)),
                                      hoverColor: Colors.transparent,
                                      filled: true,
                                      fillColor: Colors.white.withOpacity(0.05),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                      suffixIcon: IconButton(
                                        icon: Icon(_obscureText ? Icons.visibility_off : Icons.visibility, color: const Color(0xFF94A3B8), size: 20),
                                        onPressed: () => setState(() => _obscureText = !_obscureText),
                                      ),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
                                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF8B5CF6), width: 1.5)),
                                    ),
                                    validator: (v) => v!.isEmpty ? 'Requerido' : null,
                                  ),
                                  const SizedBox(height: 32),

                                  Consumer<AuthProvider>(
                                    builder: (context, auth, child) {
                                      return Container(
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(
                                            colors: [Color(0xFF7C3AED), Color(0xFF4F46E5)], // violet-600 to indigo-600
                                            begin: Alignment.centerLeft,
                                            end: Alignment.centerRight,
                                          ),
                                          borderRadius: BorderRadius.circular(12),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFF8B5CF6).withOpacity(0.3),
                                              blurRadius: 16,
                                              offset: const Offset(0, 4),
                                            )
                                          ],
                                        ),
                                        child: ElevatedButton(
                                          onPressed: auth.isLoading ? null : _login,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.transparent,
                                            shadowColor: Colors.transparent,
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(vertical: 16),
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            disabledForegroundColor: Colors.white.withOpacity(0.5),
                                            disabledBackgroundColor: Colors.transparent,
                                          ),
                                          child: auth.isLoading
                                              ? const SizedBox(
                                                  height: 20, width: 20,
                                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                              : Row(
                                                  mainAxisAlignment: MainAxisAlignment.center,
                                                  children: [
                                                    const Icon(Icons.login, size: 18),
                                                    const SizedBox(width: 8),
                                                    Text(
                                                      'Entrar al Sistema',
                                                      style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold),
                                                    ),
                                                  ],
                                                ),
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      Text(
                        '© 2026 SaaSERP Victoria · Todos los derechos reservados',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(color: const Color(0xFF475569), fontSize: 11), // slate-600
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated background blob (Shared logic for the login background)
// ─────────────────────────────────────────────────────────────────────────────
class _AnimatedBlob extends StatefulWidget {
  final double size;
  final Color color;
  final double? top;
  final double? bottom;
  final double? left;
  final double? right;
  final bool delayed;
  
  const _AnimatedBlob({
    required this.size,
    required this.color,
    this.top,
    this.bottom,
    this.left,
    this.right,
    this.delayed = false,
  });

  @override
  State<_AnimatedBlob> createState() => _AnimatedBlobState();
}

class _AnimatedBlobState extends State<_AnimatedBlob> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 8))..repeat(reverse: true);
    _anim = Tween(begin: 0.85, end: 1.15).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
    if (widget.delayed) {
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) _ctrl.forward();
      });
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: widget.top,
      bottom: widget.bottom,
      left: widget.left,
      right: widget.right,
      child: AnimatedBuilder(
        animation: _anim,
        builder: (_, __) => Transform.scale(
          scale: _anim.value,
          child: ImageFiltered(
            imageFilter: ImageFilter.blur(sigmaX: 70, sigmaY: 70),
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(color: widget.color, shape: BoxShape.circle),
            ),
          ),
        ),
      ),
    );
  }
}
