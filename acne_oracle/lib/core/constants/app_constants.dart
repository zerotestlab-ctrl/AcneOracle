// Keys are loaded from lib/core/constants/secrets.dart (gitignored).
// Copy secrets.dart.example to secrets.dart and fill in your values.
import 'secrets.dart';

class AppConstants {
  static const String appName = 'Acne Oracle';
  static const String packageName = 'com.acneoracle.app';

  // Supabase — values come from secrets.dart
  static const String supabaseUrl = Secrets.supabaseUrl;
  static const String supabaseAnonKey = Secrets.supabaseAnonKey;

  // AI APIs — values come from secrets.dart
  static const String grokApiKey = Secrets.grokApiKey;
  static const String openAiApiKey =
      String.fromEnvironment('OPENAI_API_KEY', defaultValue: '');
  static const String grokApiUrl = 'https://api.x.ai/v1';
  static const String openAiApiUrl = 'https://api.openai.com/v1';

  // RevenueCat
  static const String revenueCatAndroidKey =
      String.fromEnvironment('REVENUECAT_API_KEY_ANDROID', defaultValue: '');
  static const String revenueCatIosKey =
      String.fromEnvironment('REVENUECAT_API_KEY_IOS', defaultValue: '');
  static const String premiumEntitlement = 'premium';
  static const String premiumOffering = 'default';

  // Supabase tables
  static const String profilesTable = 'profiles';
  static const String dailyLogsTable = 'daily_logs';
  static const String photosTable = 'photos';
  static const String analysesTable = 'analyses';
  static const String chatMessagesTable = 'chat_messages';
  static const String routinesTable = 'routines';
  static const String photosBucket = 'user-photos';

  // Shared Prefs keys
  static const String onboardingCompleteKey = 'onboarding_complete';
  static const String streakKey = 'daily_streak';
  static const String lastCheckInKey = 'last_checkin';
}
