import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/business/providers/business_provider.dart';
import 'features/business/screens/business_selector_screen.dart';
import 'features/home/screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SaaSerpApp());
}

class SaaSerpApp extends StatelessWidget {
  const SaaSerpApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => BusinessProvider()),
      ],
      child: MaterialApp(
        title: 'SaaSERP Mobile',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.indigo,
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          textTheme: GoogleFonts.interTextTheme(Theme.of(context).textTheme),
          appBarTheme: AppBarTheme(
            backgroundColor: const Color(0xFF1E293B),
            foregroundColor: Colors.white,
            elevation: 0,
            titleTextStyle: GoogleFonts.inter(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 18,
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isChecking = true;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  void _checkAuth() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    await auth.checkAuthStatus();
    setState(() => _isChecking = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_isChecking) {
      return Scaffold(
        backgroundColor: const Color(0xFF1E293B),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'SaaSERP',
                style: GoogleFonts.inter(
                  fontSize: 40,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: -1.0,
                ),
              ),
              const SizedBox(height: 32),
              const CircularProgressIndicator(color: Colors.blue),
            ],
          ),
        ),
      );
    }

    return Consumer2<AuthProvider, BusinessProvider>(
      builder: (context, auth, business, child) {
        if (!auth.isAuthenticated) {
          return const LoginScreen();
        }

        if (business.negocioActivo == null) {
          return const BusinessSelectorScreen();
        }

        return const HomeScreen();
      },
    );
  }
}
