"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { SlideOver } from "@/components/common/SlideOver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateAdminUser } from "@/features/admin/hooks/useAdminUsers";
import {
  createAdminUserSchema,
  type CreateAdminUserDto,
} from "@/lib/validations/admin.schema";

interface CreateUserSheetProps {
  open: boolean;
  onClose: () => void;
}

const defaultValues: CreateAdminUserDto = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "ADMIN",
  userType: "SYSTEM_ADMIN",
  isActive: true,
  phone: "",
  propertyGroup: undefined,
};

const roleTypeOptions: CreateAdminUserDto["role"][] = ["ADMIN", "USER"];
const userTypeOptions: CreateAdminUserDto["userType"][] = [
  "SYSTEM_ADMIN",
  "LANDLORD",
  "TENANT",
];

export function CreateUserSheet({ open, onClose }: CreateUserSheetProps) {
  const createMutation = useCreateAdminUser();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateAdminUserDto>({
    resolver: zodResolver(createAdminUserSchema),
    defaultValues,
    shouldUnregister: true,
  });

  const userType = useWatch({ control, name: "userType" });
  const propertyGroup = useWatch({ control, name: "propertyGroup" });

  useEffect(() => {
    if (userType === "LANDLORD" && !propertyGroup) {
      setValue("propertyGroup", {
        groupName: "",
        currencyCode: "PHP",
        timezone: "Asia/Manila",
      });
      return;
    }
    if (userType !== "LANDLORD" && propertyGroup) {
      setValue("propertyGroup", undefined);
    }
  }, [userType, propertyGroup, setValue]);

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const onSubmit = async (values: CreateAdminUserDto) => {
    const payload: CreateAdminUserDto = {
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone?.trim() || undefined,
      propertyGroup:
        values.userType === "LANDLORD" && values.propertyGroup
          ? {
              groupName: values.propertyGroup.groupName.trim(),
              currencyCode:
                values.propertyGroup.currencyCode.trim().toUpperCase() || "PHP",
              timezone: values.propertyGroup.timezone.trim() || "Asia/Manila",
            }
          : undefined,
    };

    await createMutation.mutateAsync(payload);
    handleClose();
  };

  return (
    <SlideOver open={open} onClose={handleClose} title="Create User">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName && (
              <p className="text-xs text-danger-600">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-xs text-danger-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-danger-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && (
            <p className="text-xs text-danger-600">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" {...register("phone")} />
          {errors.phone && (
            <p className="text-xs text-danger-600">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="role">Role Type</Label>
          <select
            id="role"
            {...register("role")}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
          >
            {roleTypeOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="text-xs text-danger-600">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="userType">User Type</Label>
          <select
            id="userType"
            {...register("userType")}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
          >
            {userTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.userType && (
            <p className="text-xs text-danger-600">{errors.userType.message}</p>
          )}
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            {...register("isActive")}
            className="h-4 w-4 rounded border-slate-300 text-primary-700"
          />
          Active account
        </label>

        {userType === "LANDLORD" ? (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Property Group
            </p>

            {errors.propertyGroup?.message && (
              <p className="text-xs text-danger-600">
                {errors.propertyGroup.message}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="propertyGroup.groupName">Group name</Label>
              <Input
                id="propertyGroup.groupName"
                {...register("propertyGroup.groupName")}
              />
              {errors.propertyGroup?.groupName && (
                <p className="text-xs text-danger-600">
                  {errors.propertyGroup.groupName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="propertyGroup.currencyCode">Currency Code</Label>
                <Input
                  id="propertyGroup.currencyCode"
                  {...register("propertyGroup.currencyCode")}
                />
                {errors.propertyGroup?.currencyCode && (
                  <p className="text-xs text-danger-600">
                    {errors.propertyGroup.currencyCode.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="propertyGroup.timezone">Timezone</Label>
                <Input
                  id="propertyGroup.timezone"
                  {...register("propertyGroup.timezone")}
                />
                {errors.propertyGroup?.timezone && (
                  <p className="text-xs text-danger-600">
                    {errors.propertyGroup.timezone.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
}

export function AddUserButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add User
      </Button>
      <CreateUserSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
