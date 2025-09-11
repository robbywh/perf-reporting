export function getWelcomeMessage(
  role: string,
  firstName: string = "Guest"
): string {
  const WELCOME_MESSAGES: Record<string, string> = {
    se: `Hi, ${firstName}! Focus on the features, we'll handle the reporting.`,
    em: `Hi, ${firstName}! Streamline your team's workflow, we'll handle the reporting.`,
    pm: `Hi, ${firstName}! Keep driving the vision, we'll simplify the reporting for you.`,
    vp: `Hi, ${firstName}! Drive innovation forward, we'll take care of the reporting.`,
    cto: `Hi, ${firstName}! Lead the technology strategy, we'll handle the reporting for you.`,
  };

  return WELCOME_MESSAGES[role] || `Hi, ${firstName}! Welcome to the platform.`;
}
