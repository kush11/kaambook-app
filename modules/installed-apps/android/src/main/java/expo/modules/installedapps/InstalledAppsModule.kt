package expo.modules.installedapps

import android.content.pm.PackageManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Answers "is this package installed?" for a list of package names. Only packages
 * declared in this module's <queries> are visible (Android 11+); any other name
 * always answers false. Never lists all installed apps.
 */
class InstalledAppsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("InstalledApps")

    Function("areInstalled") { packages: List<String> ->
      val pm = appContext.reactContext?.packageManager
        ?: return@Function packages.associateWith { false }
      packages.associateWith { pkg -> isInstalled(pm, pkg) }
    }
  }

  private fun isInstalled(pm: PackageManager, pkg: String): Boolean = try {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      pm.getPackageInfo(pkg, PackageManager.PackageInfoFlags.of(0))
    } else {
      @Suppress("DEPRECATION")
      pm.getPackageInfo(pkg, 0)
    }
    true
  } catch (e: PackageManager.NameNotFoundException) {
    false
  }
}
