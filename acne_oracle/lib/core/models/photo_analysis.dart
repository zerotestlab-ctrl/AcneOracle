class PhotoEntry {
  final String id;
  final String userId;
  final String photoUrl;
  final DateTime capturedAt;
  final PhotoAnalysis? analysis;

  const PhotoEntry({
    required this.id,
    required this.userId,
    required this.photoUrl,
    required this.capturedAt,
    this.analysis,
  });

  factory PhotoEntry.fromJson(Map<String, dynamic> json) {
    return PhotoEntry(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      photoUrl: json['photo_url'] ?? '',
      capturedAt: DateTime.parse(json['captured_at'] ?? DateTime.now().toIso8601String()),
      analysis: json['analysis'] != null ? PhotoAnalysis.fromJson(json['analysis']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'photo_url': photoUrl,
      'captured_at': capturedAt.toIso8601String(),
    };
  }
}

class PhotoAnalysis {
  final String id;
  final String photoId;
  final String userId;
  final int acneScore;
  final String severity;
  final int inflammationLevel;
  final int progressPercent;
  final List<String> detectedIssues;
  final String aiSummary;
  final String recommendations;
  final Map<String, dynamic> rawAnalysis;
  final DateTime analyzedAt;

  const PhotoAnalysis({
    required this.id,
    required this.photoId,
    required this.userId,
    required this.acneScore,
    required this.severity,
    required this.inflammationLevel,
    required this.progressPercent,
    required this.detectedIssues,
    required this.aiSummary,
    required this.recommendations,
    required this.rawAnalysis,
    required this.analyzedAt,
  });

  factory PhotoAnalysis.fromJson(Map<String, dynamic> json) {
    return PhotoAnalysis(
      id: json['id'] ?? '',
      photoId: json['photo_id'] ?? '',
      userId: json['user_id'] ?? '',
      acneScore: json['acne_score'] ?? 0,
      severity: json['severity'] ?? 'none',
      inflammationLevel: json['inflammation_level'] ?? 0,
      progressPercent: json['progress_percent'] ?? 0,
      detectedIssues: List<String>.from(json['detected_issues'] ?? []),
      aiSummary: json['ai_summary'] ?? '',
      recommendations: json['recommendations'] ?? '',
      rawAnalysis: Map<String, dynamic>.from(json['raw_analysis'] ?? {}),
      analyzedAt: DateTime.parse(json['analyzed_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'photo_id': photoId,
      'user_id': userId,
      'acne_score': acneScore,
      'severity': severity,
      'inflammation_level': inflammationLevel,
      'progress_percent': progressPercent,
      'detected_issues': detectedIssues,
      'ai_summary': aiSummary,
      'recommendations': recommendations,
      'raw_analysis': rawAnalysis,
      'analyzed_at': analyzedAt.toIso8601String(),
    };
  }
}
