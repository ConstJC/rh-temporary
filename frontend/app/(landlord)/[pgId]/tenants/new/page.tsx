'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePropertyGroup } from '@/hooks/usePropertyGroup';
import { useCreateTenant } from '@/features/landlord/hooks/useTenants';
import { toast } from 'sonner';

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Unable to create tenant. Please try again.';
}

export default function NewTenantPage() {
  const { pgId } = usePropertyGroup();
  const router = useRouter();
  const createTenant = useCreateTenant(pgId);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firstNameValue = firstName.trim();
    const lastNameValue = lastName.trim();
    const phoneValue = phone.trim();
    const emailValue = email.trim();

    if (!firstNameValue || !lastNameValue || !phoneValue || !emailValue) {
      toast.error('First name, last name, phone, and email are required.');
      return;
    }

    try {
      const created = await createTenant.mutateAsync({
        firstName: firstNameValue,
        lastName: lastNameValue,
        phone: phoneValue,
        email: emailValue,
      });
      toast.success(
        'Tenant created. Account setup email has been prepared for the tenant.',
      );
      router.push(`/${pgId}/tenants/${created.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <PageHeader
        title="Add Tenant"
        description="Create a tenant profile"
        action={
          <Button variant="outline" onClick={() => router.push(`/${pgId}/tenants`)}>
            Cancel
          </Button>
        }
      />

      <Card className="mt-6 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Tenant Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="firstName">
                  First Name
                </label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Maria"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="lastName">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Santos"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="phone">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="09171234567"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="maria@example.com"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push(`/${pgId}/tenants`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTenant.isPending}>
                {createTenant.isPending ? 'Saving...' : 'Create Tenant'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
