import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:percent_indicator/percent_indicator.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/daily_log.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider);
    final logsAsync = ref.watch(dailyLogsProvider);
    final streakAsync = ref.watch(streakProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 0,
            floating: true,
            snap: true,
            backgroundColor: AppColors.background,
            elevation: 0,
            title: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [AppColors.gold, AppColors.primary],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: const Icon(Icons.auto_awesome, color: Colors.white, size: 16),
                ),
                const SizedBox(width: 10),
                Text(
                  'Acne Oracle',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            actions: [
              profileAsync.when(
                data: (profile) => GestureDetector(
                  onTap: () => context.go('/profile'),
                  child: Container(
                    margin: const EdgeInsets.only(right: 16),
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.primary.withOpacity(0.1),
                    ),
                    child: profile?.avatarUrl != null
                        ? ClipOval(child: Image.network(profile!.avatarUrl!, fit: BoxFit.cover))
                        : const Icon(Icons.person_rounded, color: AppColors.primary, size: 20),
                  ),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                profileAsync.when(
                  data: (profile) => _GreetingBanner(
                    name: profile?.displayName,
                    motivationalMessage: profile?.oracleMotivationalMessage,
                  ),
                  loading: () => const _LoadingCard(),
                  error: (_, __) => const _GreetingBanner(),
                ),
                const SizedBox(height: 20),
                streakAsync.when(
                  data: (streak) => _StreakCard(streak: streak),
                  loading: () => const _LoadingCard(),
                  error: (_, __) => const _StreakCard(streak: 0),
                ),
                const SizedBox(height: 20),
                logsAsync.when(
                  data: (logs) => _AcneScoreCard(logs: logs),
                  loading: () => const _LoadingCard(height: 200),
                  error: (_, __) => const SizedBox.shrink(),
                ),
                const SizedBox(height: 20),
                logsAsync.when(
                  data: (logs) => _HealingProgressGraph(logs: logs),
                  loading: () => const _LoadingCard(height: 220),
                  error: (_, __) => const SizedBox.shrink(),
                ),
                const SizedBox(height: 20),
                const _FutureSkinPreviewCard(),
                const SizedBox(height: 20),
                _QuickActionsGrid(),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _GreetingBanner extends StatelessWidget {
  final String? name;
  final String? motivationalMessage;

  const _GreetingBanner({this.name, this.motivationalMessage});

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$_greeting${name != null ? ", $name" : ""}! 👋',
          style: GoogleFonts.inter(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        if (motivationalMessage != null) ...[
          const SizedBox(height: 6),
          Text(
            motivationalMessage!,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
        ],
      ],
    );
  }
}

class _StreakCard extends StatelessWidget {
  final int streak;
  const _StreakCard({required this.streak});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFF7E6), Color(0xFFFEF3C7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gold.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Text('🔥', style: TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$streak Day Streak',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF92400E),
                  ),
                ),
                Text(
                  streak == 0 ? 'Start your streak today!' : 'Keep it up! Consistency is key.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFFB45309),
                  ),
                ),
              ],
            ),
          ),
          if (streak > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.gold.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '🏆',
                style: GoogleFonts.inter(fontSize: 16),
              ),
            ),
        ],
      ),
    );
  }
}

class _AcneScoreCard extends StatelessWidget {
  final List<DailyLog> logs;
  const _AcneScoreCard({required this.logs});

  int get _latestScore {
    for (final log in logs) {
      if (log.acneScore != null) return log.acneScore!;
    }
    return 65;
  }

  String get _scoreLabel {
    final s = _latestScore;
    if (s <= 20) return 'Excellent!';
    if (s <= 40) return 'Very Good';
    if (s <= 60) return 'Fair';
    if (s <= 80) return 'Needs Work';
    return 'Critical';
  }

  Color get _scoreColor {
    final s = _latestScore;
    if (s <= 20) return AppColors.severityNone;
    if (s <= 40) return AppColors.mint;
    if (s <= 60) return AppColors.severityMild;
    if (s <= 80) return AppColors.severityModerate;
    return AppColors.severitySevere;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Skin Health Score',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: CircularPercentIndicator(
              radius: 75,
              lineWidth: 12,
              percent: (100 - _latestScore) / 100,
              center: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${100 - _latestScore}',
                    style: GoogleFonts.inter(
                      fontSize: 36,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    _scoreLabel,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: _scoreColor,
                    ),
                  ),
                ],
              ),
              progressColor: _scoreColor,
              backgroundColor: AppColors.surfaceVariant,
              circularStrokeCap: CircularStrokeCap.round,
              animation: true,
              animationDuration: 1200,
            ),
          ),
          const SizedBox(height: 16),
          _ScoreIndicators(),
        ],
      ),
    );
  }
}

class _ScoreIndicators extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _ScoreChip(color: AppColors.severityNone, label: 'Clear', range: '80-100'),
        _ScoreChip(color: AppColors.severityMild, label: 'Mild', range: '60-79'),
        _ScoreChip(color: AppColors.severityModerate, label: 'Moderate', range: '40-59'),
        _ScoreChip(color: AppColors.severitySevere, label: 'Severe', range: '0-39'),
      ],
    );
  }
}

class _ScoreChip extends StatelessWidget {
  final Color color;
  final String label, range;
  const _ScoreChip({required this.color, required this.label, required this.range});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(height: 4),
        Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
        Text(range, style: GoogleFonts.inter(fontSize: 9, color: AppColors.textTertiary)),
      ],
    );
  }
}

class _HealingProgressGraph extends StatelessWidget {
  final List<DailyLog> logs;
  const _HealingProgressGraph({required this.logs});

  @override
  Widget build(BuildContext context) {
    final dataLogs = logs.where((l) => l.acneScore != null).take(14).toList().reversed.toList();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Healing Progress',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                'Last 14 days',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppColors.textTertiary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 140,
            child: dataLogs.isEmpty
                ? Center(
                    child: Text(
                      'Track your first day to see progress here',
                      style: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 13),
                      textAlign: TextAlign.center,
                    ),
                  )
                : LineChart(
                    LineChartData(
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        horizontalInterval: 25,
                        getDrawingHorizontalLine: (v) => FlLine(
                          color: AppColors.surfaceVariant,
                          strokeWidth: 1,
                        ),
                      ),
                      titlesData: const FlTitlesData(
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      borderData: FlBorderData(show: false),
                      lineBarsData: [
                        LineChartBarData(
                          spots: List.generate(
                            dataLogs.length,
                            (i) => FlSpot(i.toDouble(), (100 - dataLogs[i].acneScore!).toDouble()),
                          ),
                          isCurved: true,
                          color: AppColors.primary,
                          barWidth: 2.5,
                          dotData: const FlDotData(show: false),
                          belowBarData: BarAreaData(
                            show: true,
                            gradient: LinearGradient(
                              colors: [
                                AppColors.primary.withOpacity(0.2),
                                AppColors.primary.withOpacity(0.0),
                              ],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ),
                          ),
                        ),
                      ],
                      minY: 0,
                      maxY: 100,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _FutureSkinPreviewCard extends StatelessWidget {
  const _FutureSkinPreviewCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A1D2E), Color(0xFF2D3561)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome, color: AppColors.gold, size: 18),
              const SizedBox(width: 8),
              Text(
                'Future Skin Preview',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Text(
              '"If you maintain your current routine and stay consistent, the Oracle predicts significantly clearer skin within 8 weeks. Your dedication to tracking is paying off. 🌟"',
              style: GoogleFonts.inter(
                color: Colors.white.withOpacity(0.9),
                fontSize: 14,
                height: 1.6,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () => context.go('/chat'),
            child: Row(
              children: [
                Text(
                  'Ask Oracle for deeper insights',
                  style: GoogleFonts.inter(
                    color: AppColors.gold,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.gold, size: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                icon: Icons.checklist_rounded,
                label: 'Start Routine',
                color: AppColors.primary,
                onTap: () => context.go('/routine'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickActionCard(
                icon: Icons.camera_alt_rounded,
                label: 'Upload Selfie',
                color: AppColors.mint,
                onTap: () => context.go('/progress'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _QuickActionCard(
                icon: Icons.auto_awesome_rounded,
                label: 'Talk to Oracle',
                color: AppColors.gold,
                onTap: () => context.go('/chat'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _QuickActionCard(
                icon: Icons.lightbulb_rounded,
                label: 'Get Plan',
                color: const Color(0xFF8B5CF6),
                onTap: () => context.go('/recommendations'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.15)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoadingCard extends StatelessWidget {
  final double height;
  const _LoadingCard({this.height = 80});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
    );
  }
}
