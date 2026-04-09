import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/models/user_profile.dart';
import '../../../shared/widgets/oracle_button.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _pageController = PageController();
  bool _isCompleting = false;

  static const int _totalSteps = 9;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _next() {
    final notifier = ref.read(onboardingNotifierProvider.notifier);
    final state = ref.read(onboardingNotifierProvider);
    if (state.currentStep < _totalSteps - 1) {
      notifier.nextStep();
      _pageController.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    }
  }

  void _back() {
    final notifier = ref.read(onboardingNotifierProvider.notifier);
    final state = ref.read(onboardingNotifierProvider);
    if (state.currentStep > 0) {
      notifier.prevStep();
      _pageController.previousPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _complete() async {
    setState(() => _isCompleting = true);
    try {
      final onboardingState = ref.read(onboardingNotifierProvider);
      final supabaseService = ref.read(supabaseServiceProvider);
      final aiService = ref.read(aiServiceProvider);
      final userId = supabaseService.currentUserId ?? '';

      var profile = UserProfile(
        id: '',
        userId: userId,
        displayName: onboardingState.displayName,
        age: onboardingState.age,
        gender: onboardingState.gender,
        skinType: onboardingState.skinType,
        skinConcerns: onboardingState.skinConcerns,
        goals: onboardingState.goals,
        lifestyle: onboardingState.lifestyle,
        currentProducts: onboardingState.currentProducts,
        customProducts: onboardingState.customProducts.isNotEmpty ? onboardingState.customProducts : null,
        monthlySpending: onboardingState.monthlySpending,
        monthlySpendingRange: onboardingState.monthlySpendingRange,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      // Generate AI Oracle Profile Summary
      try {
        final aiResult = await aiService.generateOracleProfileSummary(profile: profile);
        profile = profile.copyWith(
          oracleProfileSummary: aiResult['profile_summary'],
          oracleMotivationalMessage: aiResult['motivational_message'],
        );
      } catch (_) {
        // If AI fails, use defaults
        profile = profile.copyWith(
          oracleProfileSummary:
              'The Oracle sees a dedicated individual on a meaningful journey toward clearer, healthier skin. Your commitment to understanding your skin\'s needs is the first step to transformation.',
          oracleMotivationalMessage:
              'Your journey starts now. Every step you track brings you closer to the skin you deserve. 🌟',
        );
      }

      await supabaseService.upsertProfile(profile);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(AppConstants.onboardingCompleteKey, true);

      if (mounted) context.go('/home');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving profile: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isCompleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(onboardingNotifierProvider);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF8F9FC), Color(0xFFEDF2FB)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(state.currentStep),
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _WelcomeStep(onNext: _next),
                    _PersonalInfoStep(onNext: _next),
                    _SkinTypeStep(onNext: _next),
                    _SkinConcernsStep(onNext: _next),
                    _GoalsStep(onNext: _next),
                    _LifestyleStep(onNext: _next),
                    _CurrentProductsStep(onNext: _next),
                    _MonthlySpendingStep(onNext: _next),
                    _OracleProfileStep(
                      onComplete: _complete,
                      isCompleting: _isCompleting,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(int step) {
    if (step == 0) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
      child: Column(
        children: [
          Row(
            children: [
              if (step > 0)
                GestureDetector(
                  onTap: _back,
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.06),
                          blurRadius: 8,
                        )
                      ],
                    ),
                    child: const Icon(Icons.arrow_back_ios_new_rounded,
                        size: 16, color: AppColors.textPrimary),
                  ),
                ),
              const Spacer(),
              Text(
                '${step}/${_totalSteps - 1}',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.textTertiary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: step / (_totalSteps - 1),
              backgroundColor: AppColors.surfaceVariant,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Step 1: Welcome ──────────────────────────────────────────────────────────

class _WelcomeStep extends StatelessWidget {
  final VoidCallback onNext;
  const _WelcomeStep({required this.onNext});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 110,
            height: 110,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF1A1D2E), Color(0xFF2D7DD2), Color(0xFFD4A843)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.35),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: const Icon(Icons.auto_awesome, color: Colors.white, size: 54),
          ),
          const SizedBox(height: 32),
          Text(
            'Meet Your\nAcne Oracle',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 34,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
              height: 1.15,
              letterSpacing: -0.8,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Your AI-powered skin companion that learns your unique skin story and guides you to clearer, healthier skin.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 16,
              color: AppColors.textSecondary,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 48),
          OracleButton(
            label: 'Begin My Journey',
            onPressed: onNext,
            isFullWidth: true,
            variant: OracleButtonVariant.gold,
          ),
          const SizedBox(height: 16),
          Text(
            '✨ Personalized AI analysis • Science-backed routines',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Step 2: Personal Info ────────────────────────────────────────────────────

class _PersonalInfoStep extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  const _PersonalInfoStep({required this.onNext});

  @override
  ConsumerState<_PersonalInfoStep> createState() => _PersonalInfoStepState();
}

class _PersonalInfoStepState extends ConsumerState<_PersonalInfoStep> {
  final _nameController = TextEditingController();
  int _age = 25;
  String? _gender;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            emoji: '👋',
            title: 'Tell us about yourself',
            subtitle: 'This helps the Oracle personalize your experience',
          ),
          const SizedBox(height: 28),
          _FieldLabel('Your name'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _nameController,
            decoration: InputDecoration(
              hintText: 'What should we call you?',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 24),
          _FieldLabel('Age'),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Row(
              children: [
                Text(
                  '$_age years',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                Expanded(
                  child: Slider(
                    value: _age.toDouble(),
                    min: 13,
                    max: 65,
                    divisions: 52,
                    activeColor: AppColors.primary,
                    inactiveColor: AppColors.surfaceVariant,
                    onChanged: (v) => setState(() => _age = v.round()),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _FieldLabel('Gender'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: ['Female', 'Male', 'Non-binary', 'Prefer not to say']
                .map((g) => _SelectChip(
                      label: g,
                      isSelected: _gender == g,
                      onTap: () => setState(() => _gender = g),
                    ))
                .toList(),
          ),
          const SizedBox(height: 36),
          OracleButton(
            label: 'Continue',
            onPressed: () {
              ref.read(onboardingNotifierProvider.notifier).setPersonalInfo(
                    _nameController.text.trim(),
                    _age,
                    _gender ?? 'Prefer not to say',
                  );
              widget.onNext();
            },
            isFullWidth: true,
          ),
        ],
      ),
    );
  }
}

// ── Step 3: Skin Type ────────────────────────────────────────────────────────

class _SkinTypeStep extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  const _SkinTypeStep({required this.onNext});

  @override
  ConsumerState<_SkinTypeStep> createState() => _SkinTypeStepState();
}

class _SkinTypeStepState extends ConsumerState<_SkinTypeStep> {
  String? _selected;

  static const _types = [
    {'emoji': '💧', 'label': 'Oily', 'desc': 'Shiny, enlarged pores, prone to breakouts'},
    {'emoji': '🏜️', 'label': 'Dry', 'desc': 'Tight, flaky, can feel rough'},
    {'emoji': '☯️', 'label': 'Combination', 'desc': 'Oily T-zone, dry cheeks'},
    {'emoji': '🌿', 'label': 'Normal', 'desc': 'Balanced, minimal issues'},
    {'emoji': '🌹', 'label': 'Sensitive', 'desc': 'Reactive, easily irritated'},
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            emoji: '🔍',
            title: 'What\'s your skin type?',
            subtitle: 'Be honest — this helps the Oracle craft the perfect routine for you',
          ),
          const SizedBox(height: 28),
          ..._types.map((t) => _SkinTypeCard(
                emoji: t['emoji']!,
                label: t['label']!,
                description: t['desc']!,
                isSelected: _selected == t['label'],
                onTap: () => setState(() => _selected = t['label']),
              )),
          const SizedBox(height: 24),
          OracleButton(
            label: 'Continue',
            onPressed: _selected == null
                ? null
                : () {
                    ref.read(onboardingNotifierProvider.notifier).setSkinType(_selected!);
                    widget.onNext();
                  },
            isFullWidth: true,
          ),
        ],
      ),
    );
  }
}

class _SkinTypeCard extends StatelessWidget {
  final String emoji, label, description;
  final bool isSelected;
  final VoidCallback onTap;

  const _SkinTypeCard({
    required this.emoji,
    required this.label,
    required this.description,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.08) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFFE5E7EB),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 28)),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    description,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 22),
          ],
        ),
      ),
    );
  }
}

// ── Step 4: Skin Concerns ────────────────────────────────────────────────────

class _SkinConcernsStep extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  const _SkinConcernsStep({required this.onNext});

  @override
  ConsumerState<_SkinConcernsStep> createState() => _SkinConcernsStepState();
}

class _SkinConcernsStepState extends ConsumerState<_SkinConcernsStep> {
  final Set<String> _selected = {};

  static const _concerns = [
    'Acne & Breakouts', 'Blackheads', 'Whiteheads', 'Cystic Acne',
    'Post-Acne Marks', 'Hyperpigmentation', 'Redness', 'Inflammation',
    'Large Pores', 'Oiliness', 'Dryness', 'Uneven Texture',
    'Dark Circles', 'Fine Lines', 'Dullness', 'Sensitivity',
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            emoji: '😟',
            title: 'What are your main concerns?',
            subtitle: 'Select all that apply — the Oracle needs the full picture',
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _concerns
                .map((c) => _SelectChip(
                      label: c,
                      isSelected: _selected.contains(c),
                      onTap: () => setState(() {
                        if (_selected.contains(c)) {
                          _selected.remove(c);
                        } else {
                          _selected.add(c);
                        }
                      }),
                    ))
                .toList(),
          ),
          const SizedBox(height: 32),
          OracleButton(
            label: 'Continue',
            onPressed: _selected.isEmpty
                ? null
                : () {
                    ref.read(onboardingNotifierProvider.notifier).setSkinConcerns(_selected.toList());
                    widget.onNext();
                  },
            isFullWidth: true,
          ),
        ],
      ),
    );
  }
}

// ── Step 5: Goals ────────────────────────────────────────────────────────────

class _GoalsStep extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  const _GoalsStep({required this.onNext});

  @override
  ConsumerState<_GoalsStep> createState() => _GoalsStepState();
}

class _GoalsStepState extends ConsumerState<_GoalsStep> {
  final Set<String> _selected = {};

  static const _goals = [
    '✨ Clear my acne completely',
    '📉 Reduce breakout frequency',
    '🌟 Fade acne scars & marks',
    '💆 Improve skin texture',
    '🔆 Achieve glowing skin',
    '🛡️ Build a consistent routine',
    '💊 Reduce need for medication',
    '📊 Understand my skin triggers',
    '💰 Optimize my skincare spending',
    '🌿 Go natural & minimal',
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            emoji: '🎯',
            title: 'What are your skin goals?',
            subtitle: 'The Oracle will tailor everything to help you achieve these',
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _goals
                .map((g) => _SelectChip(
                      label: g,
                      isSelected: _selected.contains(g),
                      onTap: () => setState(() {
                        if (_selected.contains(g)) {
                          _selected.remove(g);
                        } else {
                          _selected.add(g);
                        }
                      }),
                    ))
                .toList(),
          ),
          const SizedBox(height: 32),
          OracleButton(
            label: 'Continue',
            onPressed: _selected.isEmpty
                ? null
                : () {
                    ref.read(onboardingNotifierProvider.notifier).setGoals(_selected.toList());
                    widget.onNext();
                  },
            isFullWidth: true,
          ),
        ],
      ),
    );
  }
}

// ── Step 6: Lifestyle ────────────────────────────────────────────────────────

class _LifestyleStep extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  const _LifestyleStep({required this.onNext});

  @override
  ConsumerState<_LifestyleStep> createState() => _LifestyleStepState();
}

class _LifestyleStepState extends ConsumerState<_LifestyleStep> {
  final Set<String> _selected = {};

  static const _lifestyle = [
    '😴 Poor sleep (< 6h)', '😊 Good sleep (7-9h)', '🏃 Exercise regularly',
    '🧘 Practice stress management', '🥤 Drink enough water (2L+)',
    '🍬 High sugar diet', '🥗 Healthy diet', '🚬 Smoker',
    '🍺 Drink alcohol', '💊 Currently on medication', '☀️ High sun exposure',
    '😰 High stress job/life', '🧴 Wear heavy makeup daily', '📱 High screen time',
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            emoji: '🌱',
            title: 'Tell us about your lifestyle',
            subtitle: 'Acne is deeply connected to how we live — be honest for the best insights',
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _lifestyle
                .map((l) => _SelectChip(
                      label: l,
                      isSelected: _selected.contains(l),
                      onTap: () => setState(() {
                        if (_selected.contains(l)) {
                          _selected.remove(l);
                        } else {
                          _selected.add(l);
                        }
                      }),
                    ))
                .toList(),
          ),
          const SizedBox(height: 32),
          OracleButton(
            label: 'Continue',
            onPressed: () {
              ref.read(onboardingNotifierProvider.notifier).setLifestyle(_selected.toList());
              widget.onNext();
            },
            isFullWidth: true,
          ),
        ],
      ),
    );
  }
}

// ── Step 7: Current Products ─────────────────────────────────────────────────

class _CurrentProductsStep extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  const _CurrentProductsStep({required this.onNext});

  @override
  ConsumerState<_CurrentProductsStep> createState() => _CurrentProductsStepState();
}

class _CurrentProductsStepState extends ConsumerState<_CurrentProductsStep> {
  final Set<String> _selected = {};
  final _customController = TextEditingController();

  static const _products = [
    '🧴 Gentle cleanser', '🧴 Foaming cleanser', '💧 Toner/Essence', '🧪 Salicylic acid',
    '🧪 Benzoyl peroxide', '🧪 Retinol/Retinoid', '💦 Niacinamide', '🌿 Tea tree oil',
    '☀️ SPF sunscreen', '💧 Hyaluronic acid serum', '🌟 Vitamin C serum',
    '🧴 Moisturizer', '🌿 AHA/BHA exfoliant', '🍯 Honey mask', '💊 Oral antibiotics',
    '💊 Birth control (for skin)', '🌸 Rose water', '📦 No routine yet',
  ];

  @override
  void dispose() {
    _customController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            emoji: '🧴',
            title: 'What products are you currently using?',
            subtitle: 'The Oracle will analyze your current routine and suggest improvements',
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _products
                .map((p) => _SelectChip(
                      label: p,
                      isSelected: _selected.contains(p),
                      onTap: () => setState(() {
                        if (_selected.contains(p)) {
                          _selected.remove(p);
                        } else {
                          _selected.add(p);
                        }
                      }),
                    ))
                .toList(),
          ),
          const SizedBox(height: 20),
          _FieldLabel('Other products (optional)'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _customController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'e.g. Differin gel, CeraVe AM lotion, Paula\'s Choice BHA...',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
              ),
              contentPadding: const EdgeInsets.all(14),
            ),
          ),
          const SizedBox(height: 32),
          OracleButton(
            label: 'Continue',
            onPressed: () {
              ref.read(onboardingNotifierProvider.notifier).setCurrentProducts(_selected.toList());
              if (_customController.text.trim().isNotEmpty) {
                ref.read(onboardingNotifierProvider.notifier).setCustomProducts(_customController.text.trim());
              }
              widget.onNext();
            },
            isFullWidth: true,
          ),
        ],
      ),
    );
  }
}

// ── Step 8: Monthly Spending ─────────────────────────────────────────────────

class _MonthlySpendingStep extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  const _MonthlySpendingStep({required this.onNext});

  @override
  ConsumerState<_MonthlySpendingStep> createState() => _MonthlySpendingStepState();
}

class _MonthlySpendingStepState extends ConsumerState<_MonthlySpendingStep> {
  double _sliderValue = 1;

  static const _ranges = [
    {'label': '\$0–20', 'emoji': '😊', 'value': 10.0, 'desc': 'Budget-conscious'},
    {'label': '\$20–50', 'emoji': '🙂', 'value': 35.0, 'desc': 'Moderate'},
    {'label': '\$50–100', 'emoji': '😄', 'value': 75.0, 'desc': 'Invested'},
    {'label': '\$100–200', 'emoji': '🤩', 'value': 150.0, 'desc': 'Premium'},
    {'label': '\$200+', 'emoji': '💎', 'value': 250.0, 'desc': 'Luxury'},
  ];

  int get _rangeIndex => _sliderValue.round().clamp(0, 4);
  Map<String, dynamic> get _currentRange => _ranges[_rangeIndex];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeader(
            emoji: '💰',
            title: 'Monthly skincare budget?',
            subtitle: 'The Oracle will suggest products that fit within your budget',
          ),
          const SizedBox(height: 40),
          Center(
            child: Text(
              _currentRange['emoji'] as String,
              style: const TextStyle(fontSize: 72),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              _currentRange['label'] as String,
              style: GoogleFonts.inter(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: Text(
              'per month • ${_currentRange['desc']}',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          const SizedBox(height: 32),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: AppColors.primary,
              inactiveTrackColor: AppColors.surfaceVariant,
              thumbColor: AppColors.primary,
              overlayColor: AppColors.primary.withOpacity(0.15),
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14),
              trackHeight: 6,
            ),
            child: Slider(
              value: _sliderValue,
              min: 0,
              max: 4,
              divisions: 4,
              onChanged: (v) => setState(() => _sliderValue = v),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: _ranges
                .map((r) => Text(
                      r['label'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: AppColors.textTertiary,
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 40),
          OracleButton(
            label: 'Continue',
            onPressed: () {
              ref.read(onboardingNotifierProvider.notifier).setMonthlySpending(
                    _currentRange['value'] as double,
                    _currentRange['label'] as String,
                  );
              widget.onNext();
            },
            isFullWidth: true,
          ),
        ],
      ),
    );
  }
}

// ── Step 9: Oracle Profile Summary ───────────────────────────────────────────

class _OracleProfileStep extends ConsumerWidget {
  final VoidCallback onComplete;
  final bool isCompleting;

  const _OracleProfileStep({required this.onComplete, required this.isCompleting});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(onboardingNotifierProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1A1D2E), Color(0xFF2D3561)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF1A1D2E).withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_awesome, color: Color(0xFFD4A843), size: 24),
                    const SizedBox(width: 10),
                    Text(
                      'Your Oracle Profile',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                _ProfileRow(
                  icon: '🌿',
                  label: 'Skin Type',
                  value: state.skinType ?? 'Not set',
                ),
                const SizedBox(height: 12),
                _ProfileRow(
                  icon: '😟',
                  label: 'Concerns',
                  value: state.skinConcerns.take(3).join(', ') +
                      (state.skinConcerns.length > 3
                          ? ' +${state.skinConcerns.length - 3} more'
                          : ''),
                ),
                const SizedBox(height: 12),
                _ProfileRow(
                  icon: '🎯',
                  label: 'Top Goal',
                  value: state.goals.isNotEmpty ? state.goals.first : 'Not set',
                ),
                const SizedBox(height: 12),
                _ProfileRow(
                  icon: '🧴',
                  label: 'Products',
                  value: '${state.currentProducts.length} products tracked',
                ),
                const SizedBox(height: 12),
                _ProfileRow(
                  icon: '💰',
                  label: 'Budget',
                  value: state.monthlySpendingRange,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFD4A843).withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Text('🔮', style: TextStyle(fontSize: 28)),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    'The Oracle will analyze all your answers and generate your personalized skin plan as soon as you press the button below.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: const Color(0xFF92400E),
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          OracleButton(
            label: isCompleting ? 'The Oracle is Reading Your Journey...' : 'Reveal My Oracle Profile',
            onPressed: isCompleting ? null : onComplete,
            isFullWidth: true,
            isLoading: isCompleting,
            variant: OracleButtonVariant.gold,
          ),
          const SizedBox(height: 12),
          Text(
            'Powered by advanced AI vision analysis',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileRow extends StatelessWidget {
  final String icon, label, value;
  const _ProfileRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(icon, style: const TextStyle(fontSize: 16)),
        const SizedBox(width: 10),
        Text(
          '$label: ',
          style: GoogleFonts.inter(
            color: Colors.white.withOpacity(0.65),
            fontSize: 13,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

// ── Shared Sub-Widgets ───────────────────────────────────────────────────────

class _StepHeader extends StatelessWidget {
  final String emoji, title, subtitle;
  const _StepHeader({required this.emoji, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(emoji, style: const TextStyle(fontSize: 40)),
        const SizedBox(height: 12),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          subtitle,
          style: GoogleFonts.inter(
            fontSize: 15,
            color: AppColors.textSecondary,
            height: 1.5,
          ),
        ),
      ],
    );
  }
}

class _SelectChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _SelectChip({required this.label, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.12) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFFE5E7EB),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
            color: isSelected ? AppColors.primary : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: AppColors.textSecondary,
      ),
    );
  }
}
