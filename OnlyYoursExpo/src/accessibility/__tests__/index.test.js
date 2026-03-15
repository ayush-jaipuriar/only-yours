describe('accessibility helpers', () => {
  it('does not assign unsupported Fabric accessibility roles to alert/status helpers', () => {
    const {
      accessibilityAlertProps,
      accessibilityStatusProps,
    } = require('../index');

    expect(accessibilityAlertProps.accessibilityRole).toBeUndefined();
    expect(accessibilityStatusProps.accessibilityRole).toBeUndefined();
    expect(accessibilityAlertProps.accessible).toBe(true);
    expect(accessibilityStatusProps.accessible).toBe(true);
  });
});
