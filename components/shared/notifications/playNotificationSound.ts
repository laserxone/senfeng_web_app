export const playNotificationSound = () => {
  const audio = new Audio("/notification.wav");
  audio.play().catch((err) => {
    console.log("Audio play failed:", err);
  });
};
