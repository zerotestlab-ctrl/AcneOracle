import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/chat_message.dart';

class OracleChatScreen extends ConsumerStatefulWidget {
  const OracleChatScreen({super.key});

  @override
  ConsumerState<OracleChatScreen> createState() => _OracleChatScreenState();
}

class _OracleChatScreenState extends ConsumerState<OracleChatScreen> {
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isInitialized = false;

  static const List<String> _suggestedPrompts = [
    '🔮 What does my skin data tell you?',
    '📊 How is my progress this week?',
    '🧴 Review my current routine',
    '🍎 What foods should I avoid?',
    '💊 Should I try retinol?',
    '🌟 What\'s my biggest win this month?',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await ref.read(chatNotifierProvider.notifier).loadHistory();
      if (mounted) {
        setState(() => _isInitialized = true);
        _scrollToBottom();
      }
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage([String? preset]) async {
    final text = preset ?? _inputController.text.trim();
    if (text.isEmpty) return;
    _inputController.clear();

    await ref.read(chatNotifierProvider.notifier).sendMessage(text);
    _scrollToBottom();
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatNotifierProvider);

    ref.listen(chatNotifierProvider, (previous, next) {
      if (next.length != previous?.length) _scrollToBottom();
    });

    return Scaffold(
      backgroundColor: const Color(0xFF0F1117),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1D2E),
        elevation: 0,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [AppColors.gold, AppColors.primary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.gold.withOpacity(0.4),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: const Icon(Icons.auto_awesome, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Acne Oracle',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Your AI Skin Guide',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: Colors.white.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.success.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: AppColors.success,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  'Online',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.success,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: !_isInitialized
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.gold),
                  )
                : messages.isEmpty
                    ? _WelcomeView(
                        onPromptTap: (prompt) => _sendMessage(prompt),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        itemCount: messages.length,
                        itemBuilder: (context, index) {
                          final msg = messages[index];
                          return _ChatBubble(message: msg);
                        },
                      ),
          ),
          _ChatInput(
            controller: _inputController,
            onSend: _sendMessage,
            suggestedPrompts: messages.isEmpty ? _suggestedPrompts : [],
          ),
        ],
      ),
    );
  }
}

class _WelcomeView extends StatelessWidget {
  final void Function(String) onPromptTap;

  const _WelcomeView({required this.onPromptTap});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 24),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFFD4A843), Color(0xFF2D7DD2)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.gold.withOpacity(0.4),
                  blurRadius: 25,
                  spreadRadius: 3,
                ),
              ],
            ),
            child: const Icon(Icons.auto_awesome, color: Colors.white, size: 40),
          ),
          const SizedBox(height: 20),
          Text(
            'I\'m Your Acne Oracle',
            style: GoogleFonts.inter(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          Text(
            'I\'ve studied your complete skin journey — your products, habits, progress photos, and daily logs. Ask me anything.',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: Colors.white.withOpacity(0.65),
              height: 1.6,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          Text(
            'Try asking...',
            style: GoogleFonts.inter(
              fontSize: 12,
              color: Colors.white.withOpacity(0.4),
              fontWeight: FontWeight.w500,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            alignment: WrapAlignment.center,
            children: [
              '🔮 What does my skin data tell you?',
              '📊 How is my progress this week?',
              '🧴 Review my current routine',
              '🍎 What foods should I avoid?',
              '💊 Should I try retinol?',
              '🌟 What\'s my biggest win this month?',
            ].map((prompt) => _PromptChip(label: prompt, onTap: () => onPromptTap(prompt))).toList(),
          ),
        ],
      ),
    );
  }
}

class _PromptChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _PromptChip({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.12)),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            color: Colors.white.withOpacity(0.85),
          ),
        ),
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final ChatMessage message;
  const _ChatBubble({required this.message});

  bool get _isUser => message.role == MessageRole.user;

  @override
  Widget build(BuildContext context) {
    if (message.isLoading) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Row(
          children: [
            _OracleAvatar(),
            const SizedBox(width: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E2235),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(16),
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _TypingDot(delay: 0),
                  const SizedBox(width: 4),
                  _TypingDot(delay: 150),
                  const SizedBox(width: 4),
                  _TypingDot(delay: 300),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: EdgeInsets.only(
        bottom: 16,
        left: _isUser ? 48 : 0,
        right: _isUser ? 0 : 48,
      ),
      child: Row(
        mainAxisAlignment: _isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!_isUser) ...[
            _OracleAvatar(),
            const SizedBox(width: 10),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: _isUser
                    ? AppColors.primary
                    : const Color(0xFF1E2235),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(_isUser ? 16 : 4),
                  bottomRight: Radius.circular(_isUser ? 4 : 16),
                ),
                boxShadow: _isUser
                    ? [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        )
                      ]
                    : null,
              ),
              child: Text(
                message.content,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: _isUser ? Colors.white : Colors.white.withOpacity(0.92),
                  height: 1.6,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OracleAvatar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [AppColors.gold, AppColors.primary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Icon(Icons.auto_awesome, color: Colors.white, size: 14),
    );
  }
}

class _TypingDot extends StatefulWidget {
  final int delay;
  const _TypingDot({required this.delay});

  @override
  State<_TypingDot> createState() => _TypingDotState();
}

class _TypingDotState extends State<_TypingDot> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _controller.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animation,
      child: Container(
        width: 6,
        height: 6,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.7),
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

class _ChatInput extends StatelessWidget {
  final TextEditingController controller;
  final void Function([String?]) onSend;
  final List<String> suggestedPrompts;

  const _ChatInput({
    required this.controller,
    required this.onSend,
    required this.suggestedPrompts,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF1A1D2E),
      child: Column(
        children: [
          if (suggestedPrompts.isNotEmpty) ...[
            SizedBox(
              height: 46,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: suggestedPrompts.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final prompt = suggestedPrompts[index];
                  return GestureDetector(
                    onTap: () => onSend(prompt),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.07),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                      ),
                      child: Center(
                        child: Text(
                          prompt,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            Divider(height: 1, color: Colors.white.withOpacity(0.08)),
          ],
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF252840),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: controller,
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                              maxLines: 4,
                              minLines: 1,
                              keyboardType: TextInputType.multiline,
                              textCapitalization: TextCapitalization.sentences,
                              decoration: InputDecoration(
                                hintText: 'Ask the Oracle anything...',
                                hintStyle: GoogleFonts.inter(
                                  color: Colors.white.withOpacity(0.35),
                                  fontSize: 14,
                                ),
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: () => onSend(),
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.gold, AppColors.primary],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.4),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
