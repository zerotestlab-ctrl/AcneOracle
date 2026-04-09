import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/supabase_service.dart';
import '../services/ai_service.dart';
import '../models/user_profile.dart';
import '../models/daily_log.dart';
import '../models/photo_analysis.dart';
import '../models/chat_message.dart';

// Services
final supabaseServiceProvider = Provider<SupabaseService>((ref) => SupabaseService());
final aiServiceProvider = Provider<AiService>((ref) => AiService());

// Auth state
final authStateProvider = StreamProvider<AuthState>((ref) {
  return ref.watch(supabaseServiceProvider).authStateChanges;
});

final currentUserProvider = Provider<User?>((ref) {
  final service = ref.watch(supabaseServiceProvider);
  return service.currentUser;
});

// Profile
final userProfileProvider = FutureProvider<UserProfile?>((ref) async {
  final service = ref.watch(supabaseServiceProvider);
  final userId = service.currentUserId;
  if (userId == null) return null;
  return service.getProfile(userId);
});

// Profile notifier for mutations
class ProfileNotifier extends AsyncNotifier<UserProfile?> {
  @override
  Future<UserProfile?> build() async {
    final service = ref.watch(supabaseServiceProvider);
    final userId = service.currentUserId;
    if (userId == null) return null;
    return service.getProfile(userId);
  }

  Future<void> updateProfile(UserProfile profile) async {
    final service = ref.read(supabaseServiceProvider);
    state = const AsyncLoading();
    try {
      final updated = await service.upsertProfile(profile);
      state = AsyncData(updated);
    } catch (e, s) {
      state = AsyncError(e, s);
    }
  }
}

final profileNotifierProvider = AsyncNotifierProvider<ProfileNotifier, UserProfile?>(() {
  return ProfileNotifier();
});

// Daily logs
final dailyLogsProvider = FutureProvider<List<DailyLog>>((ref) async {
  final service = ref.watch(supabaseServiceProvider);
  final userId = service.currentUserId;
  if (userId == null) return [];
  return service.getDailyLogs(userId, limit: 30);
});

final todayLogProvider = FutureProvider<DailyLog?>((ref) async {
  final service = ref.watch(supabaseServiceProvider);
  final userId = service.currentUserId;
  if (userId == null) return null;
  return service.getTodayLog(userId);
});

// Photos
final photosProvider = FutureProvider<List<PhotoEntry>>((ref) async {
  final service = ref.watch(supabaseServiceProvider);
  final userId = service.currentUserId;
  if (userId == null) return [];
  return service.getPhotos(userId);
});

// Chat messages
class ChatNotifier extends Notifier<List<ChatMessage>> {
  @override
  List<ChatMessage> build() => [];

  Future<void> loadHistory() async {
    final service = ref.read(supabaseServiceProvider);
    final userId = service.currentUserId;
    if (userId == null) return;
    final history = await service.getChatHistory(userId);
    state = history;
  }

  Future<void> sendMessage(String userText) async {
    final service = ref.read(supabaseServiceProvider);
    final aiService = ref.read(aiServiceProvider);
    final userId = service.currentUserId;
    if (userId == null) return;

    final profile = await service.getProfile(userId);
    final logs = await service.getDailyLogs(userId, limit: 30);
    final photos = await service.getPhotos(userId, limit: 10);
    final analyses = photos.where((p) => p.analysis != null).map((p) => p.analysis!).toList();

    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      userId: userId,
      sessionId: 'main',
      role: MessageRole.user,
      content: userText,
      createdAt: DateTime.now(),
    );

    final loadingMsg = ChatMessage(
      id: 'loading',
      userId: userId,
      sessionId: 'main',
      role: MessageRole.assistant,
      content: '',
      createdAt: DateTime.now(),
      isLoading: true,
    );

    state = [...state, userMsg, loadingMsg];

    try {
      await service.saveChatMessage(userMsg);

      final reply = await aiService.chat(
        history: state.where((m) => !m.isLoading).toList(),
        userMessage: userText,
        profile: profile ?? UserProfile(
          id: '',
          userId: userId,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
        recentLogs: logs,
        recentAnalyses: analyses,
      );

      final assistantMsg = ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: userId,
        sessionId: 'main',
        role: MessageRole.assistant,
        content: reply,
        createdAt: DateTime.now(),
      );

      await service.saveChatMessage(assistantMsg);

      state = [...state.where((m) => m.id != 'loading').toList(), assistantMsg];
    } catch (e) {
      final errorMsg = ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: userId,
        sessionId: 'main',
        role: MessageRole.assistant,
        content: "I'm having trouble connecting right now. Please check your internet connection and try again. 🔮",
        createdAt: DateTime.now(),
      );
      state = [...state.where((m) => m.id != 'loading').toList(), errorMsg];
    }
  }
}

final chatNotifierProvider = NotifierProvider<ChatNotifier, List<ChatMessage>>(() {
  return ChatNotifier();
});

// Streak
final streakProvider = FutureProvider<int>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getInt('daily_streak') ?? 0;
});

// Onboarding state
class OnboardingState {
  final int currentStep;
  final String? skinType;
  final List<String> skinConcerns;
  final List<String> goals;
  final List<String> lifestyle;
  final List<String> currentProducts;
  final String customProducts;
  final double monthlySpending;
  final String monthlySpendingRange;
  final String? displayName;
  final int? age;
  final String? gender;

  const OnboardingState({
    this.currentStep = 0,
    this.skinType,
    this.skinConcerns = const [],
    this.goals = const [],
    this.lifestyle = const [],
    this.currentProducts = const [],
    this.customProducts = '',
    this.monthlySpending = 0,
    this.monthlySpendingRange = '\$0-20',
    this.displayName,
    this.age,
    this.gender,
  });

  OnboardingState copyWith({
    int? currentStep,
    String? skinType,
    List<String>? skinConcerns,
    List<String>? goals,
    List<String>? lifestyle,
    List<String>? currentProducts,
    String? customProducts,
    double? monthlySpending,
    String? monthlySpendingRange,
    String? displayName,
    int? age,
    String? gender,
  }) {
    return OnboardingState(
      currentStep: currentStep ?? this.currentStep,
      skinType: skinType ?? this.skinType,
      skinConcerns: skinConcerns ?? this.skinConcerns,
      goals: goals ?? this.goals,
      lifestyle: lifestyle ?? this.lifestyle,
      currentProducts: currentProducts ?? this.currentProducts,
      customProducts: customProducts ?? this.customProducts,
      monthlySpending: monthlySpending ?? this.monthlySpending,
      monthlySpendingRange: monthlySpendingRange ?? this.monthlySpendingRange,
      displayName: displayName ?? this.displayName,
      age: age ?? this.age,
      gender: gender ?? this.gender,
    );
  }
}

class OnboardingNotifier extends Notifier<OnboardingState> {
  @override
  OnboardingState build() => const OnboardingState();

  void nextStep() => state = state.copyWith(currentStep: state.currentStep + 1);
  void prevStep() => state = state.copyWith(currentStep: state.currentStep - 1);
  void setSkinType(String type) => state = state.copyWith(skinType: type);
  void setSkinConcerns(List<String> concerns) => state = state.copyWith(skinConcerns: concerns);
  void setGoals(List<String> goals) => state = state.copyWith(goals: goals);
  void setLifestyle(List<String> lifestyle) => state = state.copyWith(lifestyle: lifestyle);
  void setCurrentProducts(List<String> products) => state = state.copyWith(currentProducts: products);
  void setCustomProducts(String custom) => state = state.copyWith(customProducts: custom);
  void setMonthlySpending(double amount, String range) =>
      state = state.copyWith(monthlySpending: amount, monthlySpendingRange: range);
  void setPersonalInfo(String name, int age, String gender) =>
      state = state.copyWith(displayName: name, age: age, gender: gender);
}

final onboardingNotifierProvider = NotifierProvider<OnboardingNotifier, OnboardingState>(() {
  return OnboardingNotifier();
});
