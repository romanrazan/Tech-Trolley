import { ROLES_KEY } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role.enum';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

describe('SalesController payment authorization', () => {
  function paymentRoles(): UserRole[] {
    const handler = Object.getOwnPropertyDescriptor(
      SalesController.prototype,
      'addPayment',
    )?.value as (...args: unknown[]) => unknown;
    return Reflect.getMetadata(ROLES_KEY, handler) as UserRole[];
  }

  it('admits owner, manager, and salesperson roles to the guarded endpoint', () => {
    expect(paymentRoles()).toEqual([
      UserRole.OWNER,
      UserRole.MANAGER,
      UserRole.SALESPERSON,
    ]);
  });

  it('passes the authenticated JWT user to the ownership check', async () => {
    const addPayment = jest.fn().mockResolvedValue(undefined);
    const controller = new SalesController({
      addPayment,
    } as unknown as SalesService);
    const payment = {
      amount: 25,
      paymentMethod: 'Cash',
      accountId: '33333333-3333-4333-8333-333333333333',
      date: '2026-09-10',
    };
    const request = {
      user: { id: 'salesperson-id', role: UserRole.SALESPERSON },
    };

    await controller.addPayment('sale-id', payment, request);

    expect(addPayment).toHaveBeenCalledWith('sale-id', payment, request.user);
  });
});
