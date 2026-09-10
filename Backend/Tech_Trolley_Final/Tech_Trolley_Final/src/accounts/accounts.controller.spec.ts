import { ROLES_KEY } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role.enum';
import { AccountsController } from './accounts.controller';

describe('AccountsController role boundaries', () => {
  function rolesFor(methodName: keyof AccountsController): UserRole[] {
    const handler = Object.getOwnPropertyDescriptor(
      AccountsController.prototype,
      methodName,
    )?.value as (...args: unknown[]) => unknown;
    return Reflect.getMetadata(ROLES_KEY, handler) as UserRole[];
  }

  it('allows salespeople to read only the minimal payment options route', () => {
    expect(rolesFor('findPaymentOptions')).toEqual([
      UserRole.OWNER,
      UserRole.MANAGER,
      UserRole.SALESPERSON,
    ]);
  });

  it.each([
    ['create', 'create'],
    ['full list', 'findAll'],
    ['single-account read', 'findOne'],
    ['update', 'update'],
    ['delete', 'remove'],
  ] as Array<[string, keyof AccountsController]>)(
    'does not add salesperson to account %s',
    (_label, methodName) => {
      expect(rolesFor(methodName)).not.toContain(UserRole.SALESPERSON);
    },
  );
});
