class DailyLog {
  final String id;
  final String userId;
  final DateTime date;
  final int? acneScore;
  final List<String> morningRoutineCompleted;
  final List<String> eveningRoutineCompleted;
  final List<String> productsUsed;
  final String? diet;
  final int? waterIntake;
  final int? sleepHours;
  final int? stressLevel;
  final String? notes;
  final DateTime createdAt;

  const DailyLog({
    required this.id,
    required this.userId,
    required this.date,
    this.acneScore,
    this.morningRoutineCompleted = const [],
    this.eveningRoutineCompleted = const [],
    this.productsUsed = const [],
    this.diet,
    this.waterIntake,
    this.sleepHours,
    this.stressLevel,
    this.notes,
    required this.createdAt,
  });

  factory DailyLog.fromJson(Map<String, dynamic> json) {
    return DailyLog(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      date: DateTime.parse(json['date'] ?? DateTime.now().toIso8601String()),
      acneScore: json['acne_score'],
      morningRoutineCompleted: List<String>.from(json['morning_routine_completed'] ?? []),
      eveningRoutineCompleted: List<String>.from(json['evening_routine_completed'] ?? []),
      productsUsed: List<String>.from(json['products_used'] ?? []),
      diet: json['diet'],
      waterIntake: json['water_intake'],
      sleepHours: json['sleep_hours'],
      stressLevel: json['stress_level'],
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'date': date.toIso8601String().split('T')[0],
      'acne_score': acneScore,
      'morning_routine_completed': morningRoutineCompleted,
      'evening_routine_completed': eveningRoutineCompleted,
      'products_used': productsUsed,
      'diet': diet,
      'water_intake': waterIntake,
      'sleep_hours': sleepHours,
      'stress_level': stressLevel,
      'notes': notes,
    };
  }
}
