/** Users are "online now" if flagged online and active within this window */
export const ONLINE_WINDOW_MS = 10 * 60 * 1000;

export function getOnlineSinceDate() {
  return new Date(Date.now() - ONLINE_WINDOW_MS);
}

export function isUserOnlineNow(user) {
  if (!user?.isOnline) return false;
  if (!user?.lastActiveAt) return false;
  return new Date(user.lastActiveAt).getTime() >= Date.now() - ONLINE_WINDOW_MS;
}

export function formatUserForAdmin(user) {
  const plain = user?.toObject ? user.toObject() : { ...user };
  return {
    ...plain,
    isOnlineNow: isUserOnlineNow(plain),
  };
}
