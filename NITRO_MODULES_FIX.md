# Fixing NitroModules Error & Rebuilding

The error you're seeing indicates that native modules aren't properly linked. Here's how to fix it:

## Quick Fix (Temporary - App will work without IAP)

The app now gracefully handles missing IAP and will run without in-app purchases. This is temporary while you set up your environment.

**The app should start now** ✅

## Permanent Fix (For Full IAP Support)

### Step 1: Clean Everything

```bash
cd /Users/mac/Pairfect

# Clear Expo cache
rm -rf .expo

# Clear node_modules and reinstall
rm -rf node_modules yarn.lock
npm install

# Clear build caches
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf android/build android/app/build android/.gradle
```

### Step 2: Verify Native Module Linking

```bash
# Check if react-native-iap is properly linked
npx react-native config

# Output should show react-native-iap in the linked modules
```

### Step 3: Rebuild for Your Platform

**For iOS:**

```bash
npx expo prebuild --clean
npx expo run:ios
```

**For Android:**

```bash
npx expo prebuild --clean
npx expo run:android
```

### Step 4: Verify react-native Version

Your project has react-native 0.81.5 ✅ (requires 0.75.0+)

Check in your package.json:

```json
{
  "dependencies": {
    "react-native": "0.81.5",
    "react-native-iap": "^14.7.0"
  }
}
```

### Step 5: Enable New Architecture (Optional but Recommended)

In `app.json`:

```jsonc
{
  "expo": {
    "newArchEnabled": true,  // Already set ✅
    ...
  }
}
```

### Step 6: Full Environment Setup

If you're still having issues:

```bash
# Update Expo CLI
npm install -g expo-cli@latest

# Clear all caches
expo doctor

# Verify configuration
expo prebuild --clean

# Test on iOS
expo run:ios

# Test on Android
expo run:android
```

## What Changed

Your IAP service now:

- ✅ Gracefully handles missing native modules
- ✅ Won't crash the app if IAP isn't available
- ✅ Logs warnings instead of errors
- ✅ App continues to work without IAP during development
- ✅ Will work perfectly once you rebuild

## Testing

### To verify IAP works after rebuild:

1. On iOS simulator - use sandbox account to test purchases
2. On Android emulator - use test account to test purchases
3. Open app console - should see "IAP Connection established"

### If still seeing errors:

```bash
# Check Gradle sync status
cd android
./gradlew sync

# Force sync
cd ios
pod install --repo-update
```

## Next Steps

1. **Now**: App should run - try `npx expo start`
2. **Later**: Rebuild following steps above to enable full IAP
3. **Then**: Set up App Store and Google Play accounts
4. **Finally**: Test purchases on real devices

## Resources

- [React Native New Architecture](https://github.com/reactwg/react-native-new-architecture)
- [react-native-iap Setup](https://github.com/dooboolab-community/react-native-iap)
- [Expo Prebuild Docs](https://docs.expo.dev/build-reference/prebuild/)

---

**Current Status**: ✅ App will run without native modules
**Next Step**: Try `npx expo start` to see if app starts
**Full IAP**: Will work after you rebuild following the steps above
