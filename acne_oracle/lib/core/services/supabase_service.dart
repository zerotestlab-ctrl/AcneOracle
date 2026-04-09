import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/app_constants.dart';
import '../models/user_profile.dart';
import '../models/daily_log.dart';
import '../models/photo_analysis.dart';
import '../models/chat_message.dart';

class SupabaseService {
  static SupabaseClient get _client => Supabase.instance.client;

  // Auth
  User? get currentUser => _client.auth.currentUser;
  String? get currentUserId => _client.auth.currentUser?.id;
  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Future<AuthResponse> signUpWithEmail(String email, String password) async {
    return await _client.auth.signUp(email: email, password: password);
  }

  Future<AuthResponse> signInWithEmail(String email, String password) async {
    return await _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<void> signInWithGoogle() async {
    await _client.auth.signInWithOAuth(OAuthProvider.google);
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  // Profile
  Future<UserProfile?> getProfile(String userId) async {
    final response = await _client
        .from(AppConstants.profilesTable)
        .select()
        .eq('user_id', userId)
        .maybeSingle();
    if (response == null) return null;
    return UserProfile.fromJson(response);
  }

  Future<UserProfile> upsertProfile(UserProfile profile) async {
    final data = profile.toJson();
    data['updated_at'] = DateTime.now().toIso8601String();

    final response = await _client
        .from(AppConstants.profilesTable)
        .upsert(data, onConflict: 'user_id')
        .select()
        .single();
    return UserProfile.fromJson(response);
  }

  // Daily Logs
  Future<List<DailyLog>> getDailyLogs(String userId, {int limit = 30}) async {
    final response = await _client
        .from(AppConstants.dailyLogsTable)
        .select()
        .eq('user_id', userId)
        .order('date', ascending: false)
        .limit(limit);
    return (response as List).map((e) => DailyLog.fromJson(e)).toList();
  }

  Future<DailyLog?> getTodayLog(String userId) async {
    final today = DateTime.now().toIso8601String().split('T')[0];
    final response = await _client
        .from(AppConstants.dailyLogsTable)
        .select()
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
    if (response == null) return null;
    return DailyLog.fromJson(response);
  }

  Future<DailyLog> upsertDailyLog(DailyLog log) async {
    final data = log.toJson();
    final response = await _client
        .from(AppConstants.dailyLogsTable)
        .upsert(data, onConflict: 'user_id,date')
        .select()
        .single();
    return DailyLog.fromJson(response);
  }

  // Photos
  Future<List<PhotoEntry>> getPhotos(String userId, {int limit = 50}) async {
    final response = await _client
        .from(AppConstants.photosTable)
        .select('*, analyses(*)')
        .eq('user_id', userId)
        .order('captured_at', ascending: false)
        .limit(limit);

    return (response as List).map((e) {
      final analyses = e['analyses'] as List?;
      if (analyses != null && analyses.isNotEmpty) {
        e['analysis'] = analyses.first;
      }
      return PhotoEntry.fromJson(e);
    }).toList();
  }

  Future<String> uploadPhoto(String userId, File file) async {
    final fileName = '${userId}_${DateTime.now().millisecondsSinceEpoch}.jpg';
    await _client.storage
        .from(AppConstants.photosBucket)
        .upload(fileName, file, fileOptions: const FileOptions(contentType: 'image/jpeg'));

    return _client.storage.from(AppConstants.photosBucket).getPublicUrl(fileName);
  }

  Future<PhotoEntry> savePhoto(String userId, String photoUrl) async {
    final response = await _client
        .from(AppConstants.photosTable)
        .insert({
          'user_id': userId,
          'photo_url': photoUrl,
          'captured_at': DateTime.now().toIso8601String(),
        })
        .select()
        .single();
    return PhotoEntry.fromJson(response);
  }

  Future<PhotoAnalysis> saveAnalysis(PhotoAnalysis analysis) async {
    final data = analysis.toJson();
    data['analyzed_at'] = DateTime.now().toIso8601String();
    final response = await _client
        .from(AppConstants.analysesTable)
        .insert(data)
        .select()
        .single();
    return PhotoAnalysis.fromJson(response);
  }

  // Chat Messages
  Future<List<ChatMessage>> getChatHistory(String userId, {int limit = 50}) async {
    final response = await _client
        .from(AppConstants.chatMessagesTable)
        .select()
        .eq('user_id', userId)
        .order('created_at', ascending: true)
        .limit(limit);
    return (response as List).map((e) => ChatMessage.fromJson(e)).toList();
  }

  Future<ChatMessage> saveChatMessage(ChatMessage message) async {
    final response = await _client
        .from(AppConstants.chatMessagesTable)
        .insert(message.toJson())
        .select()
        .single();
    return ChatMessage.fromJson(response);
  }

  // Routines
  Future<Map<String, dynamic>?> getRoutine(String userId) async {
    final response = await _client
        .from(AppConstants.routinesTable)
        .select()
        .eq('user_id', userId)
        .maybeSingle();
    return response;
  }

  Future<void> upsertRoutine(String userId, Map<String, dynamic> routine) async {
    routine['user_id'] = userId;
    routine['updated_at'] = DateTime.now().toIso8601String();
    await _client
        .from(AppConstants.routinesTable)
        .upsert(routine, onConflict: 'user_id');
  }
}
