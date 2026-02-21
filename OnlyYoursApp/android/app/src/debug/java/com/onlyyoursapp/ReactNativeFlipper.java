/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.onlyyoursapp;

import android.content.Context;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.defaults.DefaultFlipperReactNativeJavaPlugin;

public final class ReactNativeFlipper {
  private ReactNativeFlipper() {}

  public static void initializeFlipper(Context context, ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      return;
    }
    DefaultFlipperReactNativeJavaPlugin.Companion.load(context, reactInstanceManager);
  }
}
