import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/onboarding/screens/onboarding_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/routine/screens/routine_screen.dart';
import '../../features/progress/screens/progress_screen.dart';
import '../../features/oracle_chat/screens/oracle_chat_screen.dart';
import '../../features/recommendations/screens/recommendations_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../shared/widgets/main_shell.dart';
import '../providers/app_providers.dart';
import '../constants/app_constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  ref.watch(authStateProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) async {
      final isAuthenticated = Supabase.instance.client.auth.currentUser != null;
      final isOnLoginPage = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';
      final isOnOnboarding = state.matchedLocation.startsWith('/onboarding');
      final isOnSplash = state.matchedLocation == '/splash';

      if (isOnSplash) return null;

      if (!isAuthenticated && !isOnLoginPage) {
        return '/login';
      }

      if (isAuthenticated && isOnLoginPage) {
        final prefs = await SharedPreferences.getInstance();
        final onboardingDone = prefs.getBool(AppConstants.onboardingCompleteKey) ?? false;
        if (!onboardingDone) return '/onboarding';
        return '/home';
      }

      if (isAuthenticated && !isOnOnboarding) {
        final prefs = await SharedPreferences.getInstance();
        final onboardingDone = prefs.getBool(AppConstants.onboardingCompleteKey) ?? false;
        if (!onboardingDone && state.matchedLocation != '/onboarding') {
          return '/onboarding';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/routine',
            builder: (context, state) => const RoutineScreen(),
          ),
          GoRoute(
            path: '/progress',
            builder: (context, state) => const ProgressScreen(),
          ),
          GoRoute(
            path: '/chat',
            builder: (context, state) => const OracleChatScreen(),
          ),
          GoRoute(
            path: '/recommendations',
            builder: (context, state) => const RecommendationsScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
    ],
  );
});

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0, 0.5)),
    );
    _scaleAnimation = Tween<double>(begin: 0.7, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
    _controller.forward();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 2200));
    if (!mounted) return;
    final isAuthenticated = Supabase.instance.client.auth.currentUser != null;
    if (isAuthenticated) {
      final prefs = await SharedPreferences.getInstance();
      final onboardingDone = prefs.getBool(AppConstants.onboardingCompleteKey) ?? false;
      if (mounted) context.go(onboardingDone ? '/home' : '/onboarding');
    } else {
      if (mounted) context.go('/login');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1A1D2E), Color(0xFF2D3561), Color(0xFF1A4A6B)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return FadeTransition(
                opacity: _fadeAnimation,
                child: ScaleTransition(
                  scale: _scaleAnimation,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFFD4A843), Color(0xFF2D7DD2)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFD4A843).withOpacity(0.4),
                              blurRadius: 30,
                              spreadRadius: 5,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.auto_awesome,
                          color: Colors.white,
                          size: 48,
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Acne Oracle',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 34,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Your AI Skin Companion',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.65),
                          fontSize: 16,
                          fontWeight: FontWeight.w400,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 48),
                      SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white.withOpacity(0.5),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
