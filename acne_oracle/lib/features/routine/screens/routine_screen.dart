import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/daily_log.dart';

class RoutineScreen extends ConsumerStatefulWidget {
  const RoutineScreen({super.key});

  @override
  ConsumerState<RoutineScreen> createState() => _RoutineScreenState();
}

class _RoutineScreenState extends ConsumerState<RoutineScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final Set<String> _morningCompleted = {};
  final Set<String> _eveningCompleted = {};
  bool _isSaving = false;

  static const _morningSteps = [
    RoutineStep('💧', 'Gentle Cleanser', 'Wash with lukewarm water, 60 seconds', false),
    RoutineStep('🧪', 'Toner / Essence', 'Apply with cotton pad or hands', false),
    RoutineStep('💊', 'Active Treatment', 'Niacinamide, BHA, or prescribed treatment', false),
    RoutineStep('💦', 'Moisturizer', 'Non-comedogenic formula', false),
    RoutineStep('☀️', 'SPF 30+ Sunscreen', 'Last step, every morning!', true),
  ];

  static const _eveningSteps = [
    RoutineStep('🧼', 'Oil Cleanser / Micellar Water', 'Remove makeup and sunscreen', false),
    RoutineStep('💧', 'Second Cleanse', 'Water-based cleanser', false),
    RoutineStep('🧴', 'Exfoliant (2-3x/week)', 'AHA or BHA — don\'t overdo it', false),
    RoutineStep('🌿', 'Treatment Serum', 'Retinol or prescription treatment', false),
    RoutineStep('🛡️', 'Barrier Moisturizer', 'Rich repair cream for nighttime', false),
  ];

  static const _nutritionItems = [
    '🥤 Drank 8+ glasses of water',
    '🥗 Ate anti-inflammatory foods',
    '🍬 Avoided high-sugar foods',
    '🥛 Limited dairy intake',
    '🌿 Took supplements (zinc, omega-3)',
    '🏃 Exercised today',
    '😴 Got 7-9 hours of sleep',
    '🧘 Managed stress',
  ];

  final Set<String> _nutritionCompleted = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadTodayLog();
  }

  Future<void> _loadTodayLog() async {
    final service = ref.read(supabaseServiceProvider);
    final userId = service.currentUserId;
    if (userId == null) return;
    final log = await service.getTodayLog(userId);
    if (log != null && mounted) {
      setState(() {
        _morningCompleted.addAll(log.morningRoutineCompleted);
        _eveningCompleted.addAll(log.eveningRoutineCompleted);
      });
    }
  }

  Future<void> _saveProgress() async {
    setState(() => _isSaving = true);
    try {
      final service = ref.read(supabaseServiceProvider);
      final userId = service.currentUserId ?? '';

      final existing = await service.getTodayLog(userId);
      final log = DailyLog(
        id: existing?.id ?? '',
        userId: userId,
        date: DateTime.now(),
        acneScore: existing?.acneScore,
        morningRoutineCompleted: _morningCompleted.toList(),
        eveningRoutineCompleted: _eveningCompleted.toList(),
        productsUsed: [..._morningCompleted, ..._eveningCompleted],
        notes: existing?.notes,
        createdAt: existing?.createdAt ?? DateTime.now(),
      );
      await service.upsertDailyLog(log);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                const SizedBox(width: 8),
                Text(
                  'Routine progress saved! Keep it up 🌟',
                  style: GoogleFonts.inter(color: Colors.white),
                ),
              ],
            ),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final morningTotal = _morningSteps.length;
    final eveningTotal = _eveningSteps.length;
    final morningDone = _morningCompleted.length;
    final eveningDone = _eveningCompleted.length;
    final overallProgress = (morningDone + eveningDone) / (morningTotal + eveningTotal);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Daily Routine',
          style: GoogleFonts.inter(fontWeight: FontWeight.w700),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textTertiary,
          indicatorColor: AppColors.primary,
          indicatorWeight: 2.5,
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
          tabs: const [
            Tab(text: '☀️ Morning'),
            Tab(text: '🌙 Evening'),
            Tab(text: '🥗 Lifestyle'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _saveProgress,
            child: _isSaving
                ? const SizedBox(
                    width: 16, height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                  )
                : Text('Save', style: GoogleFonts.inter(color: AppColors.primary, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: Column(
        children: [
          _ProgressHeader(
            overallProgress: overallProgress,
            morningDone: morningDone,
            morningTotal: morningTotal,
            eveningDone: eveningDone,
            eveningTotal: eveningTotal,
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _StepsList(
                  steps: _morningSteps,
                  completed: _morningCompleted,
                  onToggle: (step) => setState(() {
                    if (_morningCompleted.contains(step)) {
                      _morningCompleted.remove(step);
                    } else {
                      _morningCompleted.add(step);
                    }
                  }),
                ),
                _StepsList(
                  steps: _eveningSteps,
                  completed: _eveningCompleted,
                  onToggle: (step) => setState(() {
                    if (_eveningCompleted.contains(step)) {
                      _eveningCompleted.remove(step);
                    } else {
                      _eveningCompleted.add(step);
                    }
                  }),
                ),
                _NutritionTab(
                  items: _nutritionItems,
                  completed: _nutritionCompleted,
                  onToggle: (item) => setState(() {
                    if (_nutritionCompleted.contains(item)) {
                      _nutritionCompleted.remove(item);
                    } else {
                      _nutritionCompleted.add(item);
                    }
                  }),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressHeader extends StatelessWidget {
  final double overallProgress;
  final int morningDone, morningTotal, eveningDone, eveningTotal;

  const _ProgressHeader({
    required this.overallProgress,
    required this.morningDone,
    required this.morningTotal,
    required this.eveningDone,
    required this.eveningTotal,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Today\'s Progress',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                '${(overallProgress * 100).round()}%',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: overallProgress,
              backgroundColor: AppColors.surfaceVariant,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _ProgressPill(
                label: '☀️ $morningDone/$morningTotal',
                color: AppColors.gold,
              ),
              const SizedBox(width: 8),
              _ProgressPill(
                label: '🌙 $eveningDone/$eveningTotal',
                color: AppColors.primary,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProgressPill extends StatelessWidget {
  final String label;
  final Color color;
  const _ProgressPill({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

class RoutineStep {
  final String emoji, title, description;
  final bool isEssential;
  const RoutineStep(this.emoji, this.title, this.description, this.isEssential);
}

class _StepsList extends StatelessWidget {
  final List<RoutineStep> steps;
  final Set<String> completed;
  final void Function(String) onToggle;

  const _StepsList({required this.steps, required this.completed, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: steps.length,
      itemBuilder: (context, index) {
        final step = steps[index];
        final isDone = completed.contains(step.title);
        return GestureDetector(
          onTap: () => onToggle(step.title),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDone ? AppColors.primary.withOpacity(0.06) : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDone ? AppColors.primary.withOpacity(0.3) : const Color(0xFFE5E7EB),
              ),
            ),
            child: Row(
              children: [
                Text(step.emoji, style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              step.title,
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: isDone ? AppColors.primary : AppColors.textPrimary,
                                decoration: isDone ? TextDecoration.lineThrough : null,
                                decorationColor: AppColors.primary,
                              ),
                            ),
                          ),
                          if (step.isEssential)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.gold.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'Essential',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.gold,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        step.description,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isDone ? AppColors.primary : Colors.transparent,
                    border: Border.all(
                      color: isDone ? AppColors.primary : const Color(0xFFD1D5DB),
                      width: 1.5,
                    ),
                  ),
                  child: isDone
                      ? const Icon(Icons.check_rounded, color: Colors.white, size: 14)
                      : null,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _NutritionTab extends StatelessWidget {
  final List<String> items;
  final Set<String> completed;
  final void Function(String) onToggle;

  const _NutritionTab({required this.items, required this.completed, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    final score = completed.length;
    final total = items.length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
            ),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.success.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              const Text('🌿', style: TextStyle(fontSize: 28)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Lifestyle Score: $score/$total',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF166534),
                      ),
                    ),
                    Text(
                      'These habits have a major impact on your skin',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: const Color(0xFF166534).withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ...items.map((item) {
          final isDone = completed.contains(item);
          return GestureDetector(
            onTap: () => onToggle(item),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: isDone ? AppColors.success.withOpacity(0.08) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDone ? AppColors.success.withOpacity(0.4) : const Color(0xFFE5E7EB),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      item,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: isDone ? AppColors.success : AppColors.textPrimary,
                        decoration: isDone ? TextDecoration.lineThrough : null,
                        decorationColor: AppColors.success,
                      ),
                    ),
                  ),
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isDone ? AppColors.success : Colors.transparent,
                      border: Border.all(
                        color: isDone ? AppColors.success : const Color(0xFFD1D5DB),
                        width: 1.5,
                      ),
                    ),
                    child: isDone
                        ? const Icon(Icons.check_rounded, color: Colors.white, size: 13)
                        : null,
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}
