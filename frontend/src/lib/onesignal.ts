import OneSignal from 'react-onesignal';

export const initOneSignal = async () => {
  try {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

    if (!appId) {
      console.warn('OneSignal App ID not configured');
      return;
    }

    await OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
    });

    console.log('OneSignal initialized successfully');
  } catch (error) {
    console.error('OneSignal initialization failed:', error);
  }
};

export const subscribeToNotifications = async () => {
  try {
    await OneSignal.showSlidedownPrompt();
  } catch (error) {
    console.error('Failed to show notification prompt:', error);
  }
};

export const setUserTags = async (userId: string, preferences: any) => {
  try {
    await OneSignal.sendTags({
      user_id: userId,
      trading_signals: preferences.tradingSignals ? 'true' : 'false',
      price_alerts: preferences.priceAlerts ? 'true' : 'false',
      news: preferences.news ? 'true' : 'false',
    });
    console.log('User tags set successfully');
  } catch (error) {
    console.error('Failed to set user tags:', error);
  }
};

export const getNotificationPermission = async (): Promise<boolean> => {
  try {
    return await OneSignal.isPushNotificationsEnabled();
  } catch (error) {
    console.error('Failed to get notification permission:', error);
    return false;
  }
};
