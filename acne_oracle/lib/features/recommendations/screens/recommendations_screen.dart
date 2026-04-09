import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/theme/app_theme.dart';

class RecommendationsScreen extends ConsumerStatefulWidget {
  const RecommendationsScreen({super.key});

  @override
  ConsumerState<RecommendationsScreen> createState() => _RecommendationsScreenState();
}

class _RecommendationsScreenState extends ConsumerState<RecommendationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = false;
  Map<String, dynamic>? _recommendations;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadRecommendations();
  }

  Future<void> _loadRecommendations() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final service = ref.read(supabaseServiceProvider);
      final aiService = ref.read(aiServiceProvider);
      final userId = service.currentUserId ?? '';

      final profile = await service.getProfile(userId);
      final logs = await service.getDailyLogs(userId, limit: 30);
      final photos = await service.getPhotos(userId, limit: 10);
      final analyses = photos.where((p) => p.analysis != null).map((p) => p.analysis!).toList();

      if (profile == null) {
        setState(() {
          _error = 'Complete your profile first to get personalized recommendations.';
          _isLoading = false;
        });
        return;
      }

      final result = await aiService.generateRecommendations(
        profile: profile,
        recentLogs: logs,
        recentAnalyses: analyses,
      );

      setState(() {
        _recommendations = jsonDecode(result);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
        _recommendations = _defaultRecommendations;
      });
    }
  }

  static final _defaultRecommendations = {
    'skincare_steps': [
      {'time': 'morning', 'step': 'Gentle Cleanser', 'product_type': 'Cleanser', 'tip': 'Use lukewarm water and massage gently for 60 seconds'},
      {'time': 'morning', 'step': 'Niacinamide Serum', 'product_type': 'Serum', 'tip': 'Apply to damp skin to reduce pores and control oil'},
      {'time': 'morning', 'step': 'Moisturizer', 'product_type': 'Moisturizer', 'tip': 'Non-comedogenic formula like CeraVe or Neutrogena'},
      {'time': 'morning', 'step': 'SPF 30+ Sunscreen', 'product_type': 'Sunscreen', 'tip': 'UV exposure worsens acne marks — never skip this!'},
      {'time': 'evening', 'step': 'Double Cleanse', 'product_type': 'Cleanser', 'tip': 'Oil cleanser first, then water-based — removes all traces'},
      {'time': 'evening', 'step': 'Salicylic Acid (2-3x/week)', 'product_type': 'Exfoliant', 'tip': 'Unclogs pores from inside — best acne-fighting ingredient'},
      {'time': 'evening', 'step': 'Retinol (start low)', 'product_type': 'Treatment', 'tip': 'Begin with 0.025%, 2x/week — builds collagen and clears pores'},
      {'time': 'evening', 'step': 'Heavy Moisturizer', 'product_type': 'Moisturizer', 'tip': 'Barrier repair overnight — look for ceramides'},
    ],
    'nutrition_tips': [
      'Eliminate dairy for 4 weeks and track any changes — it\'s a top acne trigger for many people',
      'Reduce refined sugar and high-GI foods (white bread, processed snacks) — they spike insulin and oil production',
      'Eat zinc-rich foods: pumpkin seeds, beef, lentils — zinc is as effective as antibiotics for some people',
      'Add omega-3s daily: salmon, flaxseed, walnuts — they reduce inflammation systemically',
      'Green tea twice daily: EGCG reduces sebum and has anti-inflammatory properties',
      'Drink 2-3L of water daily — dehydration concentrates toxins and worsens breakouts',
    ],
    'recipes': [
      {
        'name': 'Anti-Acne Green Smoothie',
        'benefits': 'Reduces inflammation, balances hormones',
        'ingredients': ['1 cup spinach', '1 cucumber', '1/2 avocado', 'Juice of 1 lemon', '1 tsp chia seeds', '1 cup coconut water'],
        'instructions': 'Blend all ingredients until smooth. Drink on empty stomach in the morning for best results.'
      },
      {
        'name': 'Turmeric Golden Milk',
        'benefits': 'Powerful anti-inflammatory, kills acne bacteria',
        'ingredients': ['2 cups oat milk', '1 tsp turmeric', '1/2 tsp cinnamon', 'Pinch of black pepper', '1 tsp honey', '1/4 tsp ginger'],
        'instructions': 'Heat oat milk, add spices, simmer 5 min. The black pepper activates turmeric\'s curcumin.'
      },
      {
        'name': 'Zinc & Omega-3 Power Bowl',
        'benefits': 'Top two nutrients for acne reduction',
        'ingredients': ['100g wild salmon', '1/4 cup pumpkin seeds', 'Mixed greens', 'Blueberries', 'Olive oil + lemon dressing'],
        'instructions': 'Grill salmon, assemble bowl. Eat 3-4x/week for measurable acne improvement.'
      },
    ],
    'lifestyle_adjustments': [
      'Change your pillowcase every 2 days — it harbors bacteria and oils from your face',
      'Never touch your face with unwashed hands — hands carry 3,000+ bacteria species',
      'Keep hair products away from your hairline — many contain pore-clogging silicones',
      'Practice 10 minutes of stress-reduction daily (meditation, breathing) — cortisol is a major acne trigger',
      'Sweat-cleanse immediately after exercise — sweat + dead skin = instant breakout formula',
      'Use a clean towel for your face only, or switch to disposable face cloths',
    ],
    'ai_insight': 'Based on your profile, the most impactful changes will be dietary modifications and optimizing your evening routine. Consistency with your current routine shows real results — every day you track is data your Oracle uses to refine your plan.',
  };

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Your Oracle Plan',
          style: GoogleFonts.inter(fontWeight: FontWeight.w700),
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textTertiary,
          indicatorColor: AppColors.primary,
          indicatorWeight: 2.5,
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
          tabs: const [
            Tab(text: '🧴 Routine'),
            Tab(text: '🥗 Nutrition'),
            Tab(text: '🍽️ Recipes'),
            Tab(text: '🌿 Lifestyle'),
          ],
        ),
        actions: [
          IconButton(
            onPressed: _loadRecommendations,
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh AI recommendations',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: AppColors.primary),
                  SizedBox(height: 16),
                  Text('Oracle is crafting your plan...'),
                ],
              ),
            )
          : _recommendations == null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.textTertiary),
                      const SizedBox(height: 16),
                      Text(
                        _error ?? 'Something went wrong',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _RoutineTab(steps: _recommendations!['skincare_steps'] as List? ?? []),
                    _NutritionTab(tips: _recommendations!['nutrition_tips'] as List? ?? []),
                    _RecipesTab(recipes: _recommendations!['recipes'] as List? ?? []),
                    _LifestyleTab(
                      adjustments: _recommendations!['lifestyle_adjustments'] as List? ?? [],
                      insight: _recommendations!['ai_insight'] as String? ?? '',
                    ),
                  ],
                ),
    );
  }
}

class _RoutineTab extends StatelessWidget {
  final List steps;
  const _RoutineTab({required this.steps});

  @override
  Widget build(BuildContext context) {
    final morning = steps.where((s) => (s['time'] as String?) == 'morning').toList();
    final evening = steps.where((s) => (s['time'] as String?) == 'evening').toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionHeader(emoji: '☀️', title: 'Morning Routine', color: AppColors.gold),
        const SizedBox(height: 10),
        ...morning.asMap().entries.map((e) => _StepCard(
          stepNumber: e.key + 1,
          step: e.value as Map,
          color: AppColors.gold,
        )),
        const SizedBox(height: 20),
        _SectionHeader(emoji: '🌙', title: 'Evening Routine', color: AppColors.primary),
        const SizedBox(height: 10),
        ...evening.asMap().entries.map((e) => _StepCard(
          stepNumber: e.key + 1,
          step: e.value as Map,
          color: AppColors.primary,
        )),
      ],
    );
  }
}

class _StepCard extends StatelessWidget {
  final int stepNumber;
  final Map step;
  final Color color;

  const _StepCard({required this.stepNumber, required this.step, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '$stepNumber',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step['step'] as String? ?? '',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  step['product_type'] as String? ?? '',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: color,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  step['tip'] as String? ?? '',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NutritionTab extends StatelessWidget {
  final List tips;
  const _NutritionTab({required this.tips});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: tips.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFF0FDF4), Color(0xFFDCFCE7)],
              ),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Text('🥗', style: TextStyle(fontSize: 28)),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Diet has a profound impact on acne. These Oracle-curated tips are tailored specifically to your skin profile.',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: const Color(0xFF166534),
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          );
        }

        final tip = tips[index - 1] as String;
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppColors.mint.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    '${index}',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.mint,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  tip,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppColors.textPrimary,
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _RecipesTab extends StatelessWidget {
  final List recipes;
  const _RecipesTab({required this.recipes});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: recipes.length,
      itemBuilder: (context, index) {
        final recipe = recipes[index] as Map;
        return _RecipeCard(recipe: recipe);
      },
    );
  }
}

class _RecipeCard extends StatefulWidget {
  final Map recipe;
  const _RecipeCard({required this.recipe});

  @override
  State<_RecipeCard> createState() => _RecipeCardState();
}

class _RecipeCardState extends State<_RecipeCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final ingredients = (widget.recipe['ingredients'] as List?)?.cast<String>() ?? [];

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFF0F9FF), Color(0xFFE0F2FE)],
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                const Text('🥤', style: TextStyle(fontSize: 24)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.recipe['name'] as String? ?? '',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        widget.recipe['benefits'] as String? ?? '',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _expanded = !_expanded),
                  child: Icon(
                    _expanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                    color: AppColors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            child: _expanded
                ? Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Ingredients',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ...ingredients.map((ing) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Row(
                                children: [
                                  Container(
                                    width: 5,
                                    height: 5,
                                    decoration: const BoxDecoration(
                                      color: AppColors.mint,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    ing,
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            )),
                        const SizedBox(height: 12),
                        Text(
                          'Instructions',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          widget.recipe['instructions'] as String? ?? '',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: AppColors.textPrimary,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

class _LifestyleTab extends StatelessWidget {
  final List adjustments;
  final String insight;

  const _LifestyleTab({required this.adjustments, required this.insight});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (insight.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1A1D2E), Color(0xFF2D3561)],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.auto_awesome, color: AppColors.gold, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    insight,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.9),
                      height: 1.6,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
        ...adjustments.asMap().entries.map((e) {
          final adj = e.value as String;
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6),
              ],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 5),
                  decoration: const BoxDecoration(
                    color: AppColors.mint,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    adj,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppColors.textPrimary,
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String emoji, title;
  final Color color;

  const _SectionHeader({required this.emoji, required this.title, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 20)),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
