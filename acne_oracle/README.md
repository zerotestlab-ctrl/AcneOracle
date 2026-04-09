# Acne Oracle 🔮

> Your AI-Powered Skin Journey

A production-ready Flutter app that provides an advanced, AI-powered acne tracking and skincare guidance experience. Built with Flutter 3.24+, Supabase, and the Grok/OpenAI API.

---

## Features

### 🎯 Onboarding (9-step conversational flow)
- Welcome screen with Oracle branding
- Personal info (name, age, gender)
- Skin type selection (5 types with descriptions)
- Skin concerns multi-select (16 options)
- Goals multi-select (10 options)
- Lifestyle assessment (14 factors)
- Current products multi-select + custom input
- Monthly spending slider with emoji reactions ($0-$200+)
- AI-generated Oracle Profile Summary

### 🏠 Dashboard
- Personalized greeting with motivational message
- Daily streak counter with fire animation
- Circular skin health score gauge (0-100)
- Healing progress line chart (last 14 days)
- Future Skin Preview card (AI insights)
- Quick action buttons (Routine, Selfie, Oracle Chat, Plan)

### ✅ Daily Routine (Tab 2)
- Morning routine checklist (5 essential steps)
- Evening routine checklist (5 steps)
- Lifestyle tracker (8 items: water, sleep, stress, etc.)
- Progress header with overall completion %
- Auto-save to Supabase

### 📸 Progress / Evolution (Tab 3)
- Photo timeline grid with skin scores
- Trend charts (acne score over time)
- AI photo analysis tab with full history
- Camera + gallery upload
- Automatic AI vision analysis on upload:
  - Acne score (0-100)
  - Severity level
  - Inflammation rating
  - Progress vs previous photo
  - Detected issues
  - Personalized recommendations

### 🔮 Oracle Chat (Tab 4 — Star Feature)
- Dark-themed premium chat interface
- Animated typing indicator
- Full user context injected in every message:
  - Complete skin profile
  - All tracked products + budget
  - Last 30 days of daily logs
  - All photo analyses
  - Routine adherence data
- Suggested prompts for first-time users
- Chat history saved to Supabase

### 💡 Recommendations / Plan
- AI-generated personalized plan with 4 tabs:
  - **Skincare Routine**: Step-by-step morning + evening
  - **Nutrition Tips**: 6+ science-backed dietary guidelines
  - **Anti-Acne Recipes**: Expandable recipe cards
  - **Lifestyle Adjustments**: Habit changes with Oracle insight
- Refreshable (calls AI API each time)

### 👤 Profile / Settings
- Profile header with Oracle summary
- Edit profile, subscription, data export
- Oracle Premium upsell sheet
- Medical disclaimer dialog
- Sign out

---

## Tech Stack

| Category | Package |
|----------|---------|
| State Management | flutter_riverpod ^2.5.1 |
| Navigation | go_router ^14.2.7 |
| Backend | supabase_flutter ^2.12.2 |
| AI | Grok API / OpenAI GPT-4o |
| Charts | fl_chart ^0.68.0 |
| Progress | percent_indicator ^4.2.3 |
| Fonts | google_fonts ^6.2.1 |
| Images | image_picker ^1.1.2 |
| Networking | dio ^5.6.0 |
| Monetization | purchases_flutter ^9.16.1 |
| Animations | flutter_animate ^4.5.0 |

---

## Setup

### 1. Prerequisites
- Flutter 3.24+
- Dart 3.5+
- Supabase account
- Grok API key (x.ai) or OpenAI API key

### 2. Supabase Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase_schema.sql` in your SQL Editor
3. Create a storage bucket named `user-photos` (set to public)
4. Enable Email Auth in Authentication settings
5. (Optional) Enable Google OAuth

### 3. Environment Variables
```bash
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key \
  --dart-define=GROK_API_KEY=your-grok-api-key \
  --dart-define=REVENUECAT_API_KEY_ANDROID=your-rc-android-key \
  --dart-define=REVENUECAT_API_KEY_IOS=your-rc-ios-key
```

### 4. Install Dependencies
```bash
flutter pub get
```

### 5. Run
```bash
flutter run
```

---

## Project Structure

```
lib/
├── main.dart                          # App entry point
├── core/
│   ├── constants/app_constants.dart   # Environment variables & config
│   ├── models/                        # Data models
│   │   ├── user_profile.dart
│   │   ├── daily_log.dart
│   │   ├── photo_analysis.dart
│   │   └── chat_message.dart
│   ├── providers/app_providers.dart   # Riverpod providers
│   ├── router/app_router.dart         # GoRouter config + SplashScreen
│   ├── services/
│   │   ├── supabase_service.dart      # All Supabase operations
│   │   └── ai_service.dart            # Grok/OpenAI integration
│   └── theme/app_theme.dart           # Colors, typography, theme
├── features/
│   ├── auth/screens/                  # Login + Register
│   ├── onboarding/screens/            # 9-step onboarding
│   ├── dashboard/screens/             # Home screen
│   ├── routine/screens/               # Daily checklist
│   ├── progress/screens/              # Photo timeline + analysis
│   ├── oracle_chat/screens/           # AI chat interface
│   ├── recommendations/screens/       # AI plan
│   └── profile/screens/               # Settings
└── shared/
    └── widgets/
        ├── main_shell.dart            # Bottom navigation
        ├── oracle_button.dart         # Reusable button component
        └── oracle_text_field.dart     # Reusable text field

supabase_schema.sql                    # Database setup script
```

---

## Design System

- **Primary**: `#2D7DD2` (Oracle Blue)
- **Gold**: `#D4A843` (Oracle Gold accent)
- **Mint**: `#50C2A7` (Calming green)
- **Background**: `#F8F9FC` (Soft white)
- **Font**: Inter (body) via Google Fonts

---

## Monetization

RevenueCat is integrated for premium subscriptions. Configure entitlements named `premium` in your RevenueCat dashboard. Premium features include:
- Unlimited Oracle Chat
- Advanced AI photo analysis
- Full progress analytics
- Personalized supplement plans
- Weekly Oracle Reports

---

## Medical Disclaimer

Acne Oracle is a wellness tracking app, not a medical device. AI analyses are for informational purposes only and do not constitute medical advice. Always consult a qualified dermatologist for skin concerns requiring medical treatment.

---

## License

MIT License — see LICENSE file for details.
