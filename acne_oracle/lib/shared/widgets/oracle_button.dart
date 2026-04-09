import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';

enum OracleButtonVariant { primary, secondary, gold, ghost }

class OracleButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isFullWidth;
  final OracleButtonVariant variant;
  final IconData? leadingIcon;
  final double? width;
  final double height;

  const OracleButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    this.isFullWidth = false,
    this.variant = OracleButtonVariant.primary,
    this.leadingIcon,
    this.width,
    this.height = 54,
  });

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null || isLoading;

    Widget child = isLoading
        ? SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: variant == OracleButtonVariant.ghost ? AppColors.primary : Colors.white,
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (leadingIcon != null) ...[
                Icon(leadingIcon, size: 18),
                const SizedBox(width: 8),
              ],
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          );

    switch (variant) {
      case OracleButtonVariant.primary:
        return SizedBox(
          width: isFullWidth ? double.infinity : width,
          height: height,
          child: ElevatedButton(
            onPressed: isDisabled ? null : onPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: isDisabled ? AppColors.primary.withOpacity(0.5) : AppColors.primary,
              foregroundColor: Colors.white,
              elevation: isDisabled ? 0 : 2,
              shadowColor: AppColors.primary.withOpacity(0.3),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: child,
          ),
        );
      case OracleButtonVariant.gold:
        return SizedBox(
          width: isFullWidth ? double.infinity : width,
          height: height,
          child: Container(
            decoration: BoxDecoration(
              gradient: isDisabled
                  ? null
                  : const LinearGradient(
                      colors: [AppColors.gold, AppColors.goldLight],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
              color: isDisabled ? AppColors.gold.withOpacity(0.4) : null,
              borderRadius: BorderRadius.circular(14),
              boxShadow: isDisabled
                  ? null
                  : [
                      BoxShadow(
                        color: AppColors.gold.withOpacity(0.35),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: isDisabled ? null : onPressed,
                borderRadius: BorderRadius.circular(14),
                child: Center(child: DefaultTextStyle(
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                  child: child,
                )),
              ),
            ),
          ),
        );
      case OracleButtonVariant.secondary:
        return SizedBox(
          width: isFullWidth ? double.infinity : width,
          height: height,
          child: OutlinedButton(
            onPressed: isDisabled ? null : onPressed,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              side: BorderSide(color: isDisabled ? AppColors.primary.withOpacity(0.3) : AppColors.primary, width: 1.5),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: child,
          ),
        );
      case OracleButtonVariant.ghost:
        return SizedBox(
          width: isFullWidth ? double.infinity : width,
          height: height,
          child: TextButton(
            onPressed: isDisabled ? null : onPressed,
            style: TextButton.styleFrom(
              foregroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: child,
          ),
        );
    }
  }
}
