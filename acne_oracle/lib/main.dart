// Acne Oracle - Your AI-Powered Skin Journey

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/constants/app_constants.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  await Supabase.initialize(
    url: AppConstants.supabaseUrl,
    anonKey: AppConstants.supabaseAnonKey,
    debug: false,
  );

  // Initialize RevenueCat (uncomment and configure with actual keys)
  // await _initializeRevenueCat();

  runApp(
    const ProviderScope(
      child: AcneOracleApp(),
    ),
  );
}

// Future<void> _initializeRevenueCat() async {
//   final apiKey = Platform.isAndroid
//       ? AppConstants.revenueCatAndroidKey
//       : AppConstants.revenueCatIosKey;
//   if (apiKey.isNotEmpty) {
//     await Purchases.setLogLevel(LogLevel.debug);
//     final config = PurchasesConfiguration(apiKey);
//     await Purchases.configure(config);
//   }
// }

class AcneOracleApp extends ConsumerWidget {
  const AcneOracleApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routerConfig: router,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: TextScaler.noScaling,
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
