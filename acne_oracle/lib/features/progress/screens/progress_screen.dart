import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/models/photo_analysis.dart';
import '../../../core/models/daily_log.dart';

class ProgressScreen extends ConsumerStatefulWidget {
  const ProgressScreen({super.key});

  @override
  ConsumerState<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends ConsumerState<ProgressScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isUploading = false;
  String? _uploadStatus;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _uploadPhoto() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (pickedFile == null) return;

    setState(() {
      _isUploading = true;
      _uploadStatus = 'Uploading photo...';
    });

    try {
      final service = ref.read(supabaseServiceProvider);
      final aiService = ref.read(aiServiceProvider);
      final userId = service.currentUserId ?? '';

      final file = File(pickedFile.path);

      setState(() => _uploadStatus = 'Storing photo...');
      final photoUrl = await service.uploadPhoto(userId, file);
      final savedPhoto = await service.savePhoto(userId, photoUrl);

      setState(() => _uploadStatus = 'Oracle is analyzing your skin... 🔮');

      final profile = await service.getProfile(userId);
      final existingPhotos = await service.getPhotos(userId, limit: 5);
      final previousAnalyses = existingPhotos
          .where((p) => p.analysis != null)
          .map((p) => p.analysis!)
          .toList();

      final analysis = await aiService.analyzePhoto(
        imageFile: file,
        photoId: savedPhoto.id,
        userId: userId,
        profile: profile,
        previousAnalyses: previousAnalyses,
      );

      await service.saveAnalysis(analysis);

      setState(() => _uploadStatus = 'Analysis complete! ✨');
      await Future.delayed(const Duration(seconds: 1));

      if (mounted) {
        ref.invalidate(photosProvider);
        _showAnalysisResult(analysis);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Upload failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() { _isUploading = false; _uploadStatus = null; });
    }
  }

  Future<void> _takePhoto() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.camera, imageQuality: 85);
    if (pickedFile == null) return;

    setState(() {
      _isUploading = true;
      _uploadStatus = 'Processing photo...';
    });

    try {
      final service = ref.read(supabaseServiceProvider);
      final aiService = ref.read(aiServiceProvider);
      final userId = service.currentUserId ?? '';
      final file = File(pickedFile.path);

      setState(() => _uploadStatus = 'Storing photo...');
      final photoUrl = await service.uploadPhoto(userId, file);
      final savedPhoto = await service.savePhoto(userId, photoUrl);

      setState(() => _uploadStatus = 'Oracle is analyzing your skin... 🔮');

      final profile = await service.getProfile(userId);
      final existingPhotos = await service.getPhotos(userId, limit: 5);
      final previousAnalyses = existingPhotos
          .where((p) => p.analysis != null)
          .map((p) => p.analysis!)
          .toList();

      final analysis = await aiService.analyzePhoto(
        imageFile: file,
        photoId: savedPhoto.id,
        userId: userId,
        profile: profile,
        previousAnalyses: previousAnalyses,
      );

      await service.saveAnalysis(analysis);
      setState(() => _uploadStatus = 'Analysis complete! ✨');
      await Future.delayed(const Duration(seconds: 1));

      if (mounted) {
        ref.invalidate(photosProvider);
        _showAnalysisResult(analysis);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() { _isUploading = false; _uploadStatus = null; });
    }
  }

  void _showAnalysisResult(PhotoAnalysis analysis) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AnalysisResultSheet(analysis: analysis),
    );
  }

  @override
  Widget build(BuildContext context) {
    final photosAsync = ref.watch(photosProvider);
    final logsAsync = ref.watch(dailyLogsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'My Journey',
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
            Tab(text: '📸 Timeline'),
            Tab(text: '📊 Trends'),
            Tab(text: '🔬 Analysis'),
          ],
        ),
      ),
      body: Stack(
        children: [
          TabBarView(
            controller: _tabController,
            children: [
              photosAsync.when(
                data: (photos) => _TimelineTab(photos: photos),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Error: $e')),
              ),
              logsAsync.when(
                data: (logs) => _TrendsTab(logs: logs),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Error: $e')),
              ),
              photosAsync.when(
                data: (photos) => _AnalysisTab(photos: photos),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Error: $e')),
              ),
            ],
          ),
          if (_isUploading)
            Container(
              color: Colors.black.withOpacity(0.65),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircularProgressIndicator(color: AppColors.primary),
                      const SizedBox(height: 20),
                      Text(
                        _uploadStatus ?? 'Processing...',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'The Oracle is studying your skin',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
      floatingActionButton: _isUploading
          ? null
          : Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                FloatingActionButton.small(
                  heroTag: 'gallery',
                  onPressed: _uploadPhoto,
                  backgroundColor: Colors.white,
                  elevation: 2,
                  child: const Icon(Icons.photo_library_rounded, color: AppColors.primary),
                ),
                const SizedBox(height: 8),
                FloatingActionButton(
                  heroTag: 'camera',
                  onPressed: _takePhoto,
                  backgroundColor: AppColors.primary,
                  child: const Icon(Icons.camera_alt_rounded, color: Colors.white),
                ),
              ],
            ),
    );
  }
}

class _TimelineTab extends StatelessWidget {
  final List<PhotoEntry> photos;
  const _TimelineTab({required this.photos});

  @override
  Widget build(BuildContext context) {
    if (photos.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.camera_alt_rounded, size: 64, color: AppColors.textTertiary),
            const SizedBox(height: 16),
            Text(
              'Start Your Photo Journey',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                'Take your first selfie to begin tracking your skin transformation',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.8,
      ),
      itemCount: photos.length,
      itemBuilder: (context, index) {
        final photo = photos[index];
        final analysis = photo.analysis;
        return _PhotoCard(photo: photo, analysis: analysis);
      },
    );
  }
}

class _PhotoCard extends StatelessWidget {
  final PhotoEntry photo;
  final PhotoAnalysis? analysis;

  const _PhotoCard({required this.photo, this.analysis});

  Color get _severityColor {
    switch (analysis?.severity) {
      case 'none': return AppColors.severityNone;
      case 'mild': return AppColors.severityMild;
      case 'moderate': return AppColors.severityModerate;
      case 'severe': return AppColors.severitySevere;
      default: return AppColors.textTertiary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: Image.network(
                photo.photoUrl,
                fit: BoxFit.cover,
                width: double.infinity,
                errorBuilder: (_, __, ___) => Container(
                  color: AppColors.surfaceVariant,
                  child: const Icon(Icons.broken_image_rounded, color: AppColors.textTertiary),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _formatDate(photo.capturedAt),
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (analysis != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _severityColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        'Score: ${100 - analysis!.acneScore}',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: _severityColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dt) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[dt.month - 1]} ${dt.day}';
  }
}

class _TrendsTab extends StatelessWidget {
  final List<DailyLog> logs;
  const _TrendsTab({required this.logs});

  @override
  Widget build(BuildContext context) {
    final dataLogs = logs.where((l) => l.acneScore != null).take(30).toList().reversed.toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _TrendCard(
            title: 'Acne Score Trend',
            subtitle: 'Last ${dataLogs.length} days with data',
            child: dataLogs.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'Log daily check-ins to see your trend',
                        style: GoogleFonts.inter(color: AppColors.textTertiary),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  )
                : SizedBox(
                    height: 160,
                    child: LineChart(
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
                        titlesData: FlTitlesData(
                          leftTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                final idx = value.toInt();
                                if (idx < 0 || idx >= dataLogs.length) return const SizedBox.shrink();
                                if (idx % 5 != 0) return const SizedBox.shrink();
                                final d = dataLogs[idx].date;
                                return Text(
                                  '${d.month}/${d.day}',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    color: AppColors.textTertiary,
                                  ),
                                );
                              },
                              reservedSize: 20,
                            ),
                          ),
                        ),
                        borderData: FlBorderData(show: false),
                        lineBarsData: [
                          LineChartBarData(
                            spots: List.generate(
                              dataLogs.length,
                              (i) => FlSpot(
                                i.toDouble(),
                                (100 - dataLogs[i].acneScore!).toDouble(),
                              ),
                            ),
                            isCurved: true,
                            color: AppColors.primary,
                            barWidth: 2.5,
                            dotData: FlDotData(
                              show: true,
                              getDotPainter: (spot, __, ___, ____) => FlDotCirclePainter(
                                radius: 3,
                                color: AppColors.primary,
                                strokeWidth: 0,
                              ),
                            ),
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
          ),
          const SizedBox(height: 16),
          _TrendCard(
            title: 'Sleep vs Skin Quality',
            subtitle: 'Correlation between rest and clarity',
            child: SizedBox(
              height: 160,
              child: Center(
                child: Text(
                  'Track more days to reveal correlations',
                  style: GoogleFonts.inter(color: AppColors.textTertiary, fontSize: 13),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TrendCard extends StatelessWidget {
  final String title, subtitle;
  final Widget child;

  const _TrendCard({required this.title, required this.subtitle, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          Text(
            subtitle,
            style: GoogleFonts.inter(fontSize: 12, color: AppColors.textTertiary),
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _AnalysisTab extends StatelessWidget {
  final List<PhotoEntry> photos;
  const _AnalysisTab({required this.photos});

  @override
  Widget build(BuildContext context) {
    final analysisPhotos = photos.where((p) => p.analysis != null).toList();

    if (analysisPhotos.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.science_rounded, size: 64, color: AppColors.textTertiary),
            const SizedBox(height: 16),
            Text(
              'No Analyses Yet',
              style: GoogleFonts.inter(
                fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                'Take a selfie and the Oracle will analyze your skin condition',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: analysisPhotos.length,
      itemBuilder: (context, index) {
        final photo = analysisPhotos[index];
        return _AnalysisCard(photo: photo, analysis: photo.analysis!);
      },
    );
  }
}

class _AnalysisCard extends StatelessWidget {
  final PhotoEntry photo;
  final PhotoAnalysis analysis;

  const _AnalysisCard({required this.photo, required this.analysis});

  Color get _severityColor {
    switch (analysis.severity) {
      case 'none': return AppColors.severityNone;
      case 'mild': return AppColors.severityMild;
      case 'moderate': return AppColors.severityModerate;
      default: return AppColors.severitySevere;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Image.network(
                  photo.photoUrl,
                  width: 60,
                  height: 60,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    width: 60,
                    height: 60,
                    color: AppColors.surfaceVariant,
                    child: const Icon(Icons.image_rounded, color: AppColors.textTertiary),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _formatDate(analysis.analyzedAt),
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        _ScoreBadge(
                          label: 'Score',
                          value: '${100 - analysis.acneScore}',
                          color: _severityColor,
                        ),
                        const SizedBox(width: 8),
                        _ScoreBadge(
                          label: 'Progress',
                          value: '${analysis.progressPercent > 0 ? "+" : ""}${analysis.progressPercent}%',
                          color: analysis.progressPercent >= 0 ? AppColors.success : AppColors.error,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 12),
          Text(
            '🔬 ${analysis.aiSummary}',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppColors.textPrimary,
              height: 1.5,
            ),
          ),
          if (analysis.detectedIssues.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: analysis.detectedIssues
                  .map((issue) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _severityColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          issue,
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: _severityColor,
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ],
          if (analysis.recommendations.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.06),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.lightbulb_rounded, color: AppColors.primary, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      analysis.recommendations,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.textPrimary,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(DateTime dt) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }
}

class _ScoreBadge extends StatelessWidget {
  final String label, value;
  final Color color;

  const _ScoreBadge({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        '$label: $value',
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

class _AnalysisResultSheet extends StatelessWidget {
  final PhotoAnalysis analysis;
  const _AnalysisResultSheet({required this.analysis});

  Color get _severityColor {
    switch (analysis.severity) {
      case 'none': return AppColors.severityNone;
      case 'mild': return AppColors.severityMild;
      case 'moderate': return AppColors.severityModerate;
      default: return AppColors.severitySevere;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(0xFFE5E7EB),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Icon(Icons.auto_awesome, color: AppColors.gold, size: 22),
              const SizedBox(width: 10),
              Text(
                'Oracle Skin Analysis',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _ResultMetric(
                label: 'Skin Score',
                value: '${100 - analysis.acneScore}',
                subtitle: analysis.severity,
                color: _severityColor,
              ),
              _ResultMetric(
                label: 'Inflammation',
                value: '${analysis.inflammationLevel}/10',
                subtitle: analysis.inflammationLevel <= 3 ? 'Low' : analysis.inflammationLevel <= 6 ? 'Medium' : 'High',
                color: analysis.inflammationLevel <= 3 ? AppColors.severityNone : analysis.inflammationLevel <= 6 ? AppColors.severityMild : AppColors.severitySevere,
              ),
              _ResultMetric(
                label: 'Progress',
                value: '${analysis.progressPercent > 0 ? "+" : ""}${analysis.progressPercent}%',
                subtitle: analysis.progressPercent >= 0 ? 'Improving' : 'Declined',
                color: analysis.progressPercent >= 0 ? AppColors.success : AppColors.error,
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Text(
              analysis.aiSummary,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.textPrimary,
                height: 1.6,
              ),
            ),
          ),
          if (analysis.recommendations.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withOpacity(0.15)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.lightbulb_outlined, color: AppColors.primary, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      analysis.recommendations,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.textPrimary,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text('Great, thanks! 🙏', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _ResultMetric extends StatelessWidget {
  final String label, value, subtitle;
  final Color color;

  const _ResultMetric({
    required this.label,
    required this.value,
    required this.subtitle,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
        Text(
          subtitle,
          style: GoogleFonts.inter(fontSize: 11, color: color, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
