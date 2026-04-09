// Environment variables - set these in your environment or .env file
// SUPABASE_URL=https://your-project.supabase.co
// SUPABASE_ANON_KEY=your-anon-key
// GROK_API_KEY=your-grok-api-key
// REVENUECAT_API_KEY_ANDROID=your-revenuecat-android-key
// REVENUECAT_API_KEY_IOS=your-revenuecat-ios-key

class AppConstants {
  static const String appName = 'Acne Oracle';
  static const String packageName = 'com.acneoracle.app';

  // Supabase
  static const String supabaseUrl =
      String.fromEnvironment('SUPABASE_URL', defaultValue: 'https://placeholder.supabase.co');
  static const String supabaseAnonKey =
      String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: 'placeholder-anon-key');

  // AI APIs
  static const String grokApiKey =
      String.fromEnvironment('GROK_API_KEY', defaultValue: '');
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
