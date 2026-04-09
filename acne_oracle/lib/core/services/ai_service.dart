import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import '../constants/app_constants.dart';
import '../models/user_profile.dart';
import '../models/daily_log.dart';
import '../models/photo_analysis.dart';
import '../models/chat_message.dart';

class AiService {
  final Dio _dio = Dio();

  bool get _useGrok => AppConstants.grokApiKey.isNotEmpty;

  String get _apiUrl => _useGrok ? AppConstants.grokApiUrl : AppConstants.openAiApiUrl;
  String get _apiKey => _useGrok ? AppConstants.grokApiKey : AppConstants.openAiApiKey;
  String get _model => _useGrok ? 'grok-2-vision-1212' : 'gpt-4o';

  Map<String, String> get _headers => {
        'Authorization': 'Bearer $_apiKey',
        'Content-Type': 'application/json',
      };

  String _buildUserContext({
    required UserProfile profile,
    required List<DailyLog> recentLogs,
    List<PhotoAnalysis>? recentAnalyses,
  }) {
    final buf = StringBuffer();
    buf.writeln('=== USER SKIN PROFILE ===');
    buf.writeln('Name: ${profile.displayName ?? "User"}');
    buf.writeln('Skin type: ${profile.skinType ?? "Unknown"}');
    buf.writeln('Skin concerns: ${profile.skinConcerns.join(", ")}');
    buf.writeln('Goals: ${profile.goals.join(", ")}');
    buf.writeln('Lifestyle: ${profile.lifestyle.join(", ")}');
    buf.writeln('Current skincare products: ${profile.currentProducts.join(", ")}');
    if (profile.customProducts?.isNotEmpty == true) {
      buf.writeln('Additional products: ${profile.customProducts}');
    }
    buf.writeln('Monthly skincare budget: ${profile.monthlySpendingRange ?? "\$${profile.monthlySpending}"}');

    if (recentLogs.isNotEmpty) {
      buf.writeln('\n=== LAST ${recentLogs.length} DAYS OF DATA ===');
      for (final log in recentLogs.take(30)) {
        buf.writeln('Date: ${log.date.toIso8601String().split("T")[0]}');
        if (log.acneScore != null) buf.writeln('  Acne score: ${log.acneScore}/100');
        if (log.morningRoutineCompleted.isNotEmpty) {
          buf.writeln('  Morning routine: ${log.morningRoutineCompleted.join(", ")}');
        }
        if (log.eveningRoutineCompleted.isNotEmpty) {
          buf.writeln('  Evening routine: ${log.eveningRoutineCompleted.join(", ")}');
        }
        if (log.stressLevel != null) buf.writeln('  Stress: ${log.stressLevel}/10');
        if (log.sleepHours != null) buf.writeln('  Sleep: ${log.sleepHours}h');
      }
    }

    if (recentAnalyses != null && recentAnalyses.isNotEmpty) {
      buf.writeln('\n=== RECENT PHOTO ANALYSES ===');
      for (final a in recentAnalyses.take(10)) {
        buf.writeln('Date: ${a.analyzedAt.toIso8601String().split("T")[0]}');
        buf.writeln('  Score: ${a.acneScore}/100, Severity: ${a.severity}');
        buf.writeln('  Inflammation: ${a.inflammationLevel}/10');
        buf.writeln('  Progress: ${a.progressPercent}%');
        if (a.detectedIssues.isNotEmpty) {
          buf.writeln('  Issues: ${a.detectedIssues.join(", ")}');
        }
      }
    }

    return buf.toString();
  }

  Future<String> chat({
    required List<ChatMessage> history,
    required String userMessage,
    required UserProfile profile,
    required List<DailyLog> recentLogs,
    List<PhotoAnalysis>? recentAnalyses,
  }) async {
    final userContext = _buildUserContext(
      profile: profile,
      recentLogs: recentLogs,
      recentAnalyses: recentAnalyses,
    );

    final systemPrompt = '''You are the Acne Oracle — an advanced, deeply empathetic AI skin health companion. You have studied this user's complete skin journey and you know them intimately. You are warm, knowledgeable, encouraging, and science-backed.

$userContext

Your role:
- Be warm, personal, and encouraging (use their name when appropriate)
- Reference specific data from their journey (scores, trends, products, habits)
- Give actionable, science-backed skincare and lifestyle advice
- Celebrate wins and gently guide improvements
- Feel like a brilliant dermatologist friend who truly knows their skin
- Use engaging language with occasional emojis (but not excessive)
- Keep responses concise but impactful (3-5 paragraphs max)
- Always end with an encouraging note or clear next step

Remember: You are the Oracle. You see their complete journey and speak with wisdom and care.''';

    final messages = [
      {'role': 'system', 'content': systemPrompt},
      ...history.where((m) => m.role != MessageRole.system).map((m) => {
            'role': m.role.name,
            'content': m.content,
          }),
      {'role': 'user', 'content': userMessage},
    ];

    final response = await _dio.post(
      '$_apiUrl/chat/completions',
      options: Options(headers: _headers),
      data: {
        'model': _model,
        'messages': messages,
        'max_tokens': 1000,
        'temperature': 0.85,
      },
    );

    return response.data['choices'][0]['message']['content'] as String;
  }

  Future<PhotoAnalysis> analyzePhoto({
    required File imageFile,
    required String photoId,
    required String userId,
    required UserProfile? profile,
    List<PhotoAnalysis>? previousAnalyses,
  }) async {
    final imageBytes = await imageFile.readAsBytes();
    final base64Image = base64Encode(imageBytes);

    String contextPart = '';
    if (profile != null) {
      contextPart = 'User skin type: ${profile.skinType}. Concerns: ${profile.skinConcerns.join(", ")}.';
    }
    if (previousAnalyses != null && previousAnalyses.isNotEmpty) {
      final last = previousAnalyses.first;
      contextPart += ' Previous score: ${last.acneScore}/100, severity: ${last.severity}.';
    }

    final prompt = '''Analyze this facial photo for acne and skin health. $contextPart

Provide a JSON response with exactly this structure:
{
  "acne_score": <0-100, where 0=clear skin, 100=severe acne>,
  "severity": "<none|mild|moderate|severe>",
  "inflammation_level": <0-10>,
  "progress_percent": <-100 to 100, positive=improvement vs last analysis, 0 if first>,
  "detected_issues": ["list", "of", "specific", "issues"],
  "ai_summary": "<2-3 sentence compassionate analysis of what you see>",
  "recommendations": "<2-3 specific, actionable recommendations based on what you see>"
}

Be accurate, compassionate, and specific. Focus on observable skin characteristics.''';

    final model = _useGrok ? 'grok-2-vision-1212' : 'gpt-4o';

    final response = await _dio.post(
      '$_apiUrl/chat/completions',
      options: Options(headers: _headers),
      data: {
        'model': model,
        'messages': [
          {
            'role': 'user',
            'content': [
              {'type': 'text', 'text': prompt},
              {
                'type': 'image_url',
                'image_url': {'url': 'data:image/jpeg;base64,$base64Image'},
              },
            ],
          }
        ],
        'max_tokens': 800,
        'response_format': {'type': 'json_object'},
      },
    );

    final content = response.data['choices'][0]['message']['content'] as String;
    final analysisJson = jsonDecode(content) as Map<String, dynamic>;

    return PhotoAnalysis(
      id: '',
      photoId: photoId,
      userId: userId,
      acneScore: (analysisJson['acne_score'] as num?)?.toInt() ?? 50,
      severity: analysisJson['severity'] as String? ?? 'mild',
      inflammationLevel: (analysisJson['inflammation_level'] as num?)?.toInt() ?? 5,
      progressPercent: (analysisJson['progress_percent'] as num?)?.toInt() ?? 0,
      detectedIssues: List<String>.from(analysisJson['detected_issues'] ?? []),
      aiSummary: analysisJson['ai_summary'] as String? ?? '',
      recommendations: analysisJson['recommendations'] as String? ?? '',
      rawAnalysis: analysisJson,
      analyzedAt: DateTime.now(),
    );
  }

  Future<Map<String, String>> generateOracleProfileSummary({
    required UserProfile profile,
  }) async {
    final prompt = '''Based on this user's onboarding data, generate a personalized Oracle Profile Summary.

User Data:
- Skin type: ${profile.skinType}
- Skin concerns: ${profile.skinConcerns.join(", ")}
- Goals: ${profile.goals.join(", ")}
- Lifestyle: ${profile.lifestyle.join(", ")}
- Current products: ${profile.currentProducts.join(", ")}
- Monthly skincare budget: ${profile.monthlySpendingRange ?? "\$${profile.monthlySpending}"}

Generate a JSON with:
{
  "profile_summary": "<3-4 sentence insightful summary of their skin situation, what you notice about their approach, and key focus areas. Make it feel personal and intelligent.>",
  "motivational_message": "<1-2 sentence warm, encouraging message that feels like it comes from a wise friend who truly understands their journey. Reference their specific goals.>"
}

Be specific, warm, and make them feel truly understood by the Oracle.''';

    final response = await _dio.post(
      '$_apiUrl/chat/completions',
      options: Options(headers: _headers),
      data: {
        'model': _useGrok ? 'grok-3-mini' : 'gpt-4o-mini',
        'messages': [
          {'role': 'user', 'content': prompt}
        ],
        'max_tokens': 500,
        'response_format': {'type': 'json_object'},
      },
    );

    final content = response.data['choices'][0]['message']['content'] as String;
    final json = jsonDecode(content) as Map<String, dynamic>;
    return {
      'profile_summary': json['profile_summary'] as String? ?? '',
      'motivational_message': json['motivational_message'] as String? ?? '',
    };
  }

  Future<String> generateRecommendations({
    required UserProfile profile,
    required List<DailyLog> recentLogs,
    List<PhotoAnalysis>? recentAnalyses,
  }) async {
    final userContext = _buildUserContext(
      profile: profile,
      recentLogs: recentLogs,
      recentAnalyses: recentAnalyses,
    );

    final prompt = '''$userContext

Based on this user's complete skin data, generate a personalized skincare and wellness plan in JSON format:
{
  "skincare_steps": [
    {"time": "morning|evening", "step": "step name", "product_type": "type", "tip": "specific tip"}
  ],
  "nutrition_tips": ["tip1", "tip2", "tip3"],
  "recipes": [
    {"name": "recipe name", "benefits": "skin benefits", "ingredients": ["..."], "instructions": "brief how-to"}
  ],
  "lifestyle_adjustments": ["adjustment1", "adjustment2"],
  "ai_insight": "2-3 sentence personalized insight based on their specific data patterns"
}

Make recommendations specific to their skin type, concerns, budget, and actual logged data.''';

    final response = await _dio.post(
      '$_apiUrl/chat/completions',
      options: Options(headers: _headers),
      data: {
        'model': _useGrok ? 'grok-3-mini' : 'gpt-4o-mini',
        'messages': [
          {'role': 'user', 'content': prompt}
        ],
        'max_tokens': 1200,
        'response_format': {'type': 'json_object'},
      },
    );

    return response.data['choices'][0]['message']['content'] as String;
  }
}
