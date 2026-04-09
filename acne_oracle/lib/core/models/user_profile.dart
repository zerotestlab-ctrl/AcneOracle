class UserProfile {
  final String id;
  final String userId;
  final String? displayName;
  final String? avatarUrl;
  final int? age;
  final String? gender;
  final String? skinType;
  final List<String> skinConcerns;
  final List<String> goals;
  final List<String> lifestyle;
  final List<String> currentProducts;
  final String? customProducts;
  final double monthlySpending;
  final String? monthlySpendingRange;
  final String? oracleProfileSummary;
  final String? oracleMotivationalMessage;
  final DateTime createdAt;
  final DateTime updatedAt;

  const UserProfile({
    required this.id,
    required this.userId,
    this.displayName,
    this.avatarUrl,
    this.age,
    this.gender,
    this.skinType,
    this.skinConcerns = const [],
    this.goals = const [],
    this.lifestyle = const [],
    this.currentProducts = const [],
    this.customProducts,
    this.monthlySpending = 0,
    this.monthlySpendingRange,
    this.oracleProfileSummary,
    this.oracleMotivationalMessage,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      displayName: json['display_name'],
      avatarUrl: json['avatar_url'],
      age: json['age'],
      gender: json['gender'],
      skinType: json['skin_type'],
      skinConcerns: List<String>.from(json['skin_concerns'] ?? []),
      goals: List<String>.from(json['goals'] ?? []),
      lifestyle: List<String>.from(json['lifestyle'] ?? []),
      currentProducts: List<String>.from(json['current_products'] ?? []),
      customProducts: json['custom_products'],
      monthlySpending: (json['monthly_spending'] ?? 0).toDouble(),
      monthlySpendingRange: json['monthly_spending_range'],
      oracleProfileSummary: json['oracle_profile_summary'],
      oracleMotivationalMessage: json['oracle_motivational_message'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updated_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'display_name': displayName,
      'avatar_url': avatarUrl,
      'age': age,
      'gender': gender,
      'skin_type': skinType,
      'skin_concerns': skinConcerns,
      'goals': goals,
      'lifestyle': lifestyle,
      'current_products': currentProducts,
      'custom_products': customProducts,
      'monthly_spending': monthlySpending,
      'monthly_spending_range': monthlySpendingRange,
      'oracle_profile_summary': oracleProfileSummary,
      'oracle_motivational_message': oracleMotivationalMessage,
    };
  }

  UserProfile copyWith({
    String? id,
    String? userId,
    String? displayName,
    String? avatarUrl,
    int? age,
    String? gender,
    String? skinType,
    List<String>? skinConcerns,
    List<String>? goals,
    List<String>? lifestyle,
    List<String>? currentProducts,
    String? customProducts,
    double? monthlySpending,
    String? monthlySpendingRange,
    String? oracleProfileSummary,
    String? oracleMotivationalMessage,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserProfile(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      displayName: displayName ?? this.displayName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      skinType: skinType ?? this.skinType,
      skinConcerns: skinConcerns ?? this.skinConcerns,
      goals: goals ?? this.goals,
      lifestyle: lifestyle ?? this.lifestyle,
      currentProducts: currentProducts ?? this.currentProducts,
      customProducts: customProducts ?? this.customProducts,
      monthlySpending: monthlySpending ?? this.monthlySpending,
      monthlySpendingRange: monthlySpendingRange ?? this.monthlySpendingRange,
      oracleProfileSummary: oracleProfileSummary ?? this.oracleProfileSummary,
      oracleMotivationalMessage: oracleMotivationalMessage ?? this.oracleMotivationalMessage,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
